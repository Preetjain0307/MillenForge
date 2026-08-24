/**
 * NeuraMind — Code Generator Utility
 * Converts UIPage JSON schema into clean, formatted React (JSX) and HTML/Tailwind code strings.
 */

export const generateReactCode = (pageResult) => {
  if (!pageResult || !pageResult.sections) {
    return `// No UI generated yet. Generate a UI to inspect React JSX code.`;
  }

  const pageName = (pageResult.page || 'GeneratedComponent').replace(/[^a-zA-Z0-9]/g, '');
  const theme = pageResult.meta?.theme || {};
  const primaryColor = theme.primary || '#8B5CF6';

  let code = `import React from 'react';\n\nexport default function ${pageName}() {\n  return (\n    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans">\n`;

  pageResult.sections.forEach((sec, idx) => {
    const secId = sec.id || `section-${idx}`;
    const secType = sec.type || 'content';

    code += `      {/* Section: ${secType.toUpperCase()} (${secId}) */}\n`;
    code += `      <section id="${secId}" className="py-16 px-6 max-w-7xl mx-auto border-b border-slate-800/60">\n`;

    if (sec.elements && sec.elements.length > 0) {
      sec.elements.forEach((el) => {
        const elType = el.type;
        const content = el.content;
        const props = el.props || {};

        if (elType === 'text') {
          const tag = props.tag || 'p';
          const textStr = typeof content === 'string' ? content : JSON.stringify(content);
          if (tag === 'h1') {
            code += `        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">\n          ${textStr}\n        </h1>\n`;
          } else if (tag === 'h2') {
            code += `        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">\n          ${textStr}\n        </h2>\n`;
          } else {
            code += `        <p className="text-slate-400 text-base leading-relaxed mb-4">\n          ${textStr}\n        </p>\n`;
          }
        } else if (elType === 'button') {
          const label = typeof content === 'string' ? content : 'Click Here';
          code += `        <button className="px-6 py-3 rounded-lg bg-[${primaryColor}] hover:opacity-90 text-white font-semibold shadow-lg transition-all">\n          ${label}\n        </button>\n`;
        } else if (elType === 'image') {
          const src = typeof content === 'object' ? content.src : content;
          const alt = (typeof content === 'object' ? content.alt : props.alt) || 'UI Banner';
          code += `        <img src="${src || 'https://images.unsplash.com/photo-1513104890138-7c749659a591'}" alt="${alt}" className="w-full rounded-xl object-cover shadow-2xl my-6" />\n`;
        } else if (elType === 'cards' || elType === 'card') {
          const items = props.items || (Array.isArray(content) ? content : []);
          code += `        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">\n`;
          items.forEach((item, i) => {
            code += `          <div key={${i}} className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 transition-all shadow-xl">\n`;
            if (item.badge) {
              code += `            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 inline-block mb-3">${item.badge}</span>\n`;
            }
            if (item.image) {
              code += `            <img src="${item.image}" alt="${item.title || 'Card'}" className="w-full h-44 object-cover rounded-lg mb-4" />\n`;
            }
            code += `            <h3 className="text-lg font-bold text-white mb-2">${item.title || 'Feature Title'}</h3>\n`;
            code += `            <p className="text-slate-400 text-sm mb-4">${item.description || 'Feature detail and specifications.'}</p>\n`;
            if (item.price) {
              code += `            <div className="flex items-center justify-between font-bold text-violet-400 text-lg"><span>${item.price}</span><button className="px-3 py-1.5 rounded-md bg-violet-600 text-white text-xs">Order</button></div>\n`;
            }
            code += `          </div>\n`;
          });
          code += `        </div>\n`;
        }
      });
    }

    code += `      </section>\n\n`;
  });

  code += `    </div>\n  );\n}\n`;
  return code;
};

export const generateHtmlCode = (pageResult) => {
  if (!pageResult || !pageResult.sections) {
    return `<!-- No UI generated yet -->`;
  }

  const title = pageResult.meta?.title || 'Generated UI';
  let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${title}</title>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body className="bg-[#0F172A] text-slate-100">\n`;

  pageResult.sections.forEach((sec, idx) => {
    html += `  <!-- Section: ${sec.type || 'content'} -->\n  <section id="${sec.id || 'sec-' + idx}" class="py-16 px-6 max-w-7xl mx-auto border-b border-slate-800">\n`;
    (sec.elements || []).forEach((el) => {
      if (el.type === 'text') {
        const text = typeof el.content === 'string' ? el.content : JSON.stringify(el.content);
        html += `    <p class="text-slate-300 mb-4">${text}</p>\n`;
      } else if (el.type === 'button') {
        html += `    <button class="px-6 py-3 rounded-lg bg-violet-600 text-white font-bold">${el.content || 'Action'}</button>\n`;
      }
    });
    html += `  </section>\n`;
  });

  html += `</body>\n</html>`;
  return html;
};
