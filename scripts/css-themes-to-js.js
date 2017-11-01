const gonzales = require('gonzales-pe');
const fs = require('fs');
const path = require('path');
const isColorDark = require('./is-color-dark');

const outputPath = path.resolve(__dirname, '../src/hljs-themes.json');
const themesPath = path.join(process.cwd(), 'node_modules/highlight.js/styles/');
const themes = fs.readdirSync(themesPath).filter((path) => path.endsWith('.css'));

const BLACKLIST = [
    'darkula', // alias for darcula
]

function parseTheme(filename) {
  const themeCss = fs.readFileSync(path.join(themesPath, filename), { encoding: 'utf-8' });
  const themeObject = Object.create({
      bgColor: '#FFF',
      isDark: false,
  });

  const tree = gonzales.parse(themeCss, {
      syntax: 'css',
  });

  tree.traverseByType('ruleset', function(node, index) {
    const declarations = {};
    let bgColor = '#FFF';
    let isRoot;

    node.traverseByType('class', (node) => {
        const classIdent = node.first('ident');
        const className = classIdent.content;
        if (className === 'hljs') {
            isRoot = true;
        }
    });

    if (!isRoot) {
        return;
    }

    node.traverseByType('declaration', (node) => {
        const property = node.first('property');
        const value = node.first('value');

        const propertyIdent = (property.first('ident') || {}).content;
        const valueIdent = (value.first('color') || value.first('ident') || {}).content;

        if (['background', 'background-color'].indexOf(propertyIdent) > -1) {
            themeObject.bgColor = value.first('color') ? `#${valueIdent}` : valueIdent;
            themeObject.isDark = isColorDark(valueIdent);
        }

        if (propertyIdent === 'color') {
            themeObject.color = value.first('color') ? `#${valueIdent}` : valueIdent;
        }
    });
  });

  return themeObject;
}

const convertedThemes = themes.reduce((memo, filename) => {
    let theme;

    try {
        theme = parseTheme(filename);
    } catch (error) {
        console.log('Parsing failed in:', filename, '\n');
        console.error(error)
    }

    const themeName = filename.replace(/\.css/ig, '');

    if (BLACKLIST.indexOf(themeName) === -1) {
        memo[themeName] = theme;
    }

    return memo;
}, {});



fs.writeFileSync(outputPath, JSON.stringify(convertedThemes, null, 2));
