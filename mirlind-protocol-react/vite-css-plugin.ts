import type { Plugin } from 'vite';

export function cssPostProcessPlugin(): Plugin {
  return {
    name: 'css-post-process',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          let css = chunk.source as string;
          
          // Fix backdrop-filter: ensure standard property comes after vendor prefix
          // Tailwind v4 uses CSS variables for backdrop-filter, so we need to add the explicit property
          
          // First, fix any glass-card class that might be missing the standard property
          if (css.includes('-webkit-backdrop-filter') && !css.includes('.glass-card{backdrop-filter:')) {
            // Add explicit glass-card fallback at the end
            css += '\n.glass-card{-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}';
          }
          
          // Ensure proper ordering throughout the CSS
          css = css.replace(
            /backdrop-filter:([^;]+);\s*-webkit-backdrop-filter:([^;]+);/g,
            '-webkit-backdrop-filter:$2;backdrop-filter:$1;'
          );
          
          chunk.source = css;
        }
      }
    },
  };
}
