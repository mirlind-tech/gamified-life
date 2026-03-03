#!/usr/bin/env python3
"""
AI Training Pipeline for Mirlind Protocol

This module handles:
- Data collection from user interactions
- Fine-tuning of language models
- Export to formats compatible with Rust inference (GGUF, ONNX)
- Model evaluation and validation
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset as HFDataset
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TrainingConfig:
    """Configuration for training"""
    base_model: str = "meta-llama/Llama-3-8b"  # or mistralai/Mistral-7B
    output_dir: str = "./models/fine-tuned"
    num_epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 2e-4
    max_seq_length: int = 2048
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    quantization: str = "4bit"  # or "8bit" or None
    device: str = "cuda" if torch.cuda.is_available() else "cpu"


class ConversationDataset(Dataset):
    """Dataset for conversation fine-tuning"""
    
    def __init__(self, conversations: List[Dict], tokenizer, max_length: int = 2048):
        self.conversations = conversations
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self):
        return len(self.conversations)
    
    def __getitem__(self, idx):
        conv = self.conversations[idx]
        
        # Format: <|system|>...<|user|>...<|assistant|>...
        formatted = self.format_conversation(conv)
        
        # Tokenize
        encoding = self.tokenizer(
            formatted,
            truncation=True,
            max_length=self.max_length,
            padding="max_length",
            return_tensors="pt",
        )
        
        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": encoding["input_ids"].squeeze(),
        }
    
    def format_conversation(self, conv: Dict) -> str:
        """Format a conversation for training"""
        messages = conv.get("messages", [])
        formatted = []
        
        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            
            if role == "system":
                formatted.append(f"<|system|>\n{content}")
            elif role == "user":
                formatted.append(f"<|user|>\n{content}")
            elif role == "assistant":
                formatted.append(f"<|assistant|>\n{content}")
        
        return "\n".join(formatted)


class DataCollector:
    """Collect training data from the database"""
    
    def __init__(self, db_url: str):
        self.db_url = db_url
    
    def collect_conversations(self, limit: int = 10000) -> List[Dict]:
        """Collect user conversations from database"""
        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT user_id, messages, metadata, created_at
                FROM ai_conversations
                WHERE created_at > NOW() - INTERVAL '30 days'
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
            
            conversations = []
            for row in cursor.fetchall():
                conversations.append({
                    "user_id": row["user_id"],
                    "messages": json.loads(row["messages"]),
                    "metadata": json.loads(row["metadata"]) if row["metadata"] else {},
                    "timestamp": row["created_at"].isoformat(),
                })
            
            return conversations
        finally:
            cursor.close()
            conn.close()
    
    def collect_protocol_data(self) -> List[Dict]:
        """Collect protocol completion data for context"""
        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        try:
            cursor.execute("""
                SELECT user_id, protocol_date, protocol_score, notes
                FROM daily_protocol
                WHERE protocol_date > CURRENT_DATE - INTERVAL '90 days'
            """)
            
            protocols = []
            for row in cursor.fetchall():
                protocols.append({
                    "user_id": row["user_id"],
                    "date": row["protocol_date"].isoformat(),
                    "score": row["protocol_score"],
                    "notes": row["notes"],
                })
            
            return protocols
        finally:
            cursor.close()
            conn.close()


class ModelTrainer:
    """Handles model training and fine-tuning"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.tokenizer = None
        self.model = None
        
    def load_base_model(self):
        """Load the base model with quantization"""
        logger.info(f"Loading base model: {self.config.base_model}")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.config.base_model,
            trust_remote_code=True,
        )
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model with quantization
        load_kwargs = {
            "torch_dtype": torch.float16,
            "device_map": "auto",
            "trust_remote_code": True,
        }
        
        if self.config.quantization == "4bit":
            from transformers import BitsAndBytesConfig
            load_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
            )
        elif self.config.quantization == "8bit":
            load_kwargs["load_in_8bit"] = True
        
        self.model = AutoModelForCausalLM.from_pretrained(
            self.config.base_model,
            **load_kwargs
        )
        
        # Prepare for training
        self.model = prepare_model_for_kbit_training(self.model)
        
        logger.info("Base model loaded successfully")
    
    def setup_lora(self):
        """Setup LoRA adapters"""
        logger.info("Setting up LoRA adapters")
        
        lora_config = LoraConfig(
            r=self.config.lora_r,
            lora_alpha=self.config.lora_alpha,
            target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
            lora_dropout=self.config.lora_dropout,
            bias="none",
            task_type="CAUSAL_LM",
        )
        
        self.model = get_peft_model(self.model, lora_config)
        self.model.print_trainable_parameters()
        
        logger.info("LoRA adapters configured")
    
    def train(self, train_dataset: Dataset, eval_dataset: Optional[Dataset] = None):
        """Run training"""
        logger.info("Starting training")
        
        training_args = TrainingArguments(
            output_dir=self.config.output_dir,
            num_train_epochs=self.config.num_epochs,
            per_device_train_batch_size=self.config.batch_size,
            per_device_eval_batch_size=self.config.batch_size,
            gradient_accumulation_steps=4,
            learning_rate=self.config.learning_rate,
            max_grad_norm=0.3,
            warmup_ratio=0.03,
            lr_scheduler_type="cosine",
            save_strategy="epoch",
            evaluation_strategy="epoch" if eval_dataset else "no",
            logging_steps=10,
            fp16=True,
            optim="paged_adamw_8bit",
            report_to="tensorboard",
        )
        
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
        )
        
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            data_collator=data_collator,
        )
        
        trainer.train()
        
        # Save model
        self.model.save_pretrained(os.path.join(self.config.output_dir, "final"))
        self.tokenizer.save_pretrained(os.path.join(self.config.output_dir, "final"))
        
        logger.info(f"Training complete. Model saved to {self.config.output_dir}")
    
    def export_to_gguf(self, output_path: str):
        """Export model to GGUF format for llama.cpp"""
        logger.info(f"Exporting to GGUF: {output_path}")
        
        # This requires llama.cpp's convert script
        import subprocess
        
        cmd = [
            "python",
            "convert-hf-to-gguf.py",
            os.path.join(self.config.output_dir, "final"),
            "--outfile", output_path,
            "--outtype", "q4_0",
        ]
        
        subprocess.run(cmd, check=True)
        logger.info("GGUF export complete")
    
    def export_to_onnx(self, output_path: str):
        """Export model to ONNX format"""
        logger.info(f"Exporting to ONNX: {output_path}")
        
        from transformers.onnx import export
        from transformers import AutoConfig
        
        config = AutoConfig.from_pretrained(self.config.base_model)
        
        onnx_path = export(
            preprocessor=self.tokenizer,
            model=self.model,
            config=config,
            opset=14,
            output=output_path,
        )
        
        logger.info(f"ONNX export complete: {onnx_path}")


def main():
    """Main training pipeline"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Train AI models for Mirlind Protocol")
    parser.add_argument("--db-url", required=True, help="PostgreSQL connection URL")
    parser.add_argument("--base-model", default="meta-llama/Llama-3-8b", help="Base model")
    parser.add_argument("--output-dir", default="./models/fine-tuned", help="Output directory")
    parser.add_argument("--epochs", type=int, default=3, help="Number of epochs")
    parser.add_argument("--export-gguf", action="store_true", help="Export to GGUF")
    parser.add_argument("--export-onnx", action="store_true", help="Export to ONNX")
    
    args = parser.parse_args()
    
    # Configuration
    config = TrainingConfig(
        base_model=args.base_model,
        output_dir=args.output_dir,
        num_epochs=args.epochs,
    )
    
    # Collect data
    logger.info("Collecting training data")
    collector = DataCollector(args.db_url)
    conversations = collector.collect_conversations(limit=5000)
    logger.info(f"Collected {len(conversations)} conversations")
    
    if len(conversations) < 100:
        logger.warning("Insufficient training data. Need at least 100 conversations.")
        return
    
    # Initialize trainer
    trainer = ModelTrainer(config)
    trainer.load_base_model()
    trainer.setup_lora()
    
    # Prepare dataset
    train_size = int(0.9 * len(conversations))
    train_convs = conversations[:train_size]
    eval_convs = conversations[train_size:]
    
    train_dataset = ConversationDataset(train_convs, trainer.tokenizer, config.max_seq_length)
    eval_dataset = ConversationDataset(eval_convs, trainer.tokenizer, config.max_seq_length) if eval_convs else None
    
    # Train
    trainer.train(train_dataset, eval_dataset)
    
    # Export
    if args.export_gguf:
        trainer.export_to_gguf(os.path.join(args.output_dir, "model.gguf"))
    
    if args.export_onnx:
        trainer.export_to_onnx(os.path.join(args.output_dir, "model.onnx"))
    
    logger.info("Training pipeline complete!")


if __name__ == "__main__":
    main()
