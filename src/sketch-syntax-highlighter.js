import hljs from "highlight.js";
import hljsThemes from "./hljs-themes.json";
import { parseString } from "xml2js";
import juice from "juice";
import colorString from "color-string";
import colorName from "color-name";
import WebUI from "sketch-module-web-view";

const BG_LAYER_NAME = 'ssh-bg';
const FONT_WEIGHTS_MAP = {
    regular: 'Menlo-Regular',
    bold: 'Menlo-Bold',
    italic: 'Menlo-Italic'
}

let initialSelection;
let selectedLanguage;

export default function(context) {
    const document = context.document;
    initialSelection = context.selection.slice(0);
    selectedLanguage = 'auto';

    const textLayers = getTextLayers(initialSelection);
    const firstTextLayer = textLayers[0];

    if (!textLayers.length) {
        document.showMessage(
            "Syntax Highlighter: Please select at least one text layer."
        );

        return;
    }

    const webUI = new WebUI(context, require("../resources/ui.html"), {
        identifier: "sketch-syntax-highlighter",
        x: 0,
        y: 0,
        width: 800,
        height: 500,
        background: NSColor.blackColor(),
        blurredBackground: false,
        onlyShowCloseButton: true,
        title: "Sketch Syntax Highlighter",
        hideTitleBar: true,
        onlyShowCloseButton: true,
        shouldKeepAround: true,
        resizable: true,
        handlers: {
            selectLanguage: function(lang) {
                selectedLanguage = lang
            },

            getSourceCode: function() {
                const source = `sketchBridge(${JSON.stringify({ source: `${firstTextLayer.stringValue()}` })})`;

                webUI.eval(source);
            },

            applyTheme: function (theme) {
                const textLayers = getTextLayers(initialSelection, true);

                textLayers.forEach((selectedItem) => {
                    highlight(selectedItem, theme);
                });

                webUI.close();
            },

            close: function() {
                webUI.close();
            }
        },
    });

    webUI.panel.setMovableByWindowBackground(true);
}

function getTextLayers(selection, cleanup = false) {
    const textLayers = [];

    selection.forEach((layer) => {
        if (layer.className() == "MSLayerGroup") {
            const container = layer.parentGroup();
            const layers = layer.layers();
            const text = layers[1];
            const bg = layers[0];

            if (layers.length == 2 && bg.name() == BG_LAYER_NAME && text.className() == 'MSTextLayer') {
                if (cleanup) {
                    layer.removeLayer(bg);
                    layer.ungroup();
                }

                textLayers.push(text);
            }
        } else if (layer.className() == "MSTextLayer") {
            textLayers.push(layer);
        }
    });

    return textLayers;
}

function highlight(textLayer, theme) {
    if (textLayer.className() != "MSTextLayer") {
        return;
    }

    const sourceCode = textLayer.stringValue();
    const highlightedHTML = `<div class="hljs">${highlightText(sourceCode, selectedLanguage)}</div>`;
    const themeCSS = require('!!raw-loader!highlight.js/styles/' + theme + '.css');
    const inlineStyledHTML = juice(`<style>${themeCSS}</style>${highlightedHTML}`);
    const xmlParserOptions = {
        trim: true,
        explicitChildren: true,
        preserveChildrenOrder: true,
        charsAsChildren: true,
        explicitRoot: false,
        childkey: 'children',
        attrkey: 'attrs',
        charkey: 'text',
        includeWhiteChars: true,
    };

    parseString(inlineStyledHTML, xmlParserOptions, (err, tree) => {
        const themeSyles = hljsThemes[theme];
        const { outputText, fragments } = getStyledRanges(tree);
        const font = NSFont.fontWithName_size(FONT_WEIGHTS_MAP.regular, fontSize);
        const fontSize = textLayer.fontSize();

        textLayer.setStringValue(outputText);

        // Set base font
        textLayer.setFont(font);

        textLayer.setIsEditingText(true);
        fragments.forEach((fragment, i ) => {
            const range = NSMakeRange(fragment.startIndex, fragment.stopIndex);
            const fontName = FONT_WEIGHTS_MAP[fragment.style['font-weight'] || fragment.style['font-style']];

            // Set Bold or Italic
            if (fontName) {
                const font = NSFont.fontWithName_size(fontName, textLayer.fontSize());
                textLayer.addAttribute_value_forRange(NSFontAttributeName, font, range);
            }

            // Set color
            textLayer.addAttribute_value_forRange(NSForegroundColorAttributeName, hexToColor(fragment.style.color || baseColor), range);
        });
        textLayer.setIsEditingText(false);

        createBgRect(textLayer, { bgColor: themeSyles.bgColor });
    });

    textLayer.syncTextStyleAttributes();
}


function getStyledRanges(parentNode, memo) {
    const styles = inlineCSSToObject((parentNode.attrs || {}).style);
    const hasColor = (styles.color && styles.color != 'inherit');

    if (!memo) {
        memo = {
            fragments: [],
            textBuffer: '',
            parentColor: hasColor ? styles.color : '#333',
        };
    }

    (parentNode.children || []).forEach((node) => {
        if (node["#name"] === "__text__") {
            const text = node.text;

            // Calculate fragment start and stop indexes
            const startIndex = memo.textBuffer.length;
            memo.textBuffer = memo.textBuffer + text;
            // @TODO: rename to fragmentLenght
            const stopIndex = text.length;

            memo.fragments.push({
                startIndex: startIndex,
                stopIndex: stopIndex,
                style: {
                    ...styles,
                    color: hasColor ? styles.color : memo.parentColor,
                }
            });
        } else if (node.children && node.children.length) {
            if (hasColor) {
                memo.parentColor = styles.color;
            }

            getStyledRanges(node, memo);
        }
    });

    return {
        outputText: memo.textBuffer,
        fragments: memo.fragments
    };
}

function inlineCSSToObject(cssText = '') {
    const regex = /([\w-]*)\s*:\s*([^;]*)/g;
    let match, properties = {};

    while(match = regex.exec(cssText)) {
        properties[match[1]] = match[2].trim();
    };

    return properties
}

function highlightText(str, lang) {
    let result;

    if (lang && lang != 'auto') {
        result = hljs.highlight(lang, str);
    } else {
        result = hljs.highlightAuto(str);
    }

    return result.value;
}

function hexToColor(hex) {
    const rgb = colorName[hex]
        ? colorName[hex]
        : colorString.get(hex).value;

    return NSColor.colorWithCalibratedRed_green_blue_alpha(
        rgb[0] / 255,
        rgb[1] / 255,
        rgb[2] / 255,
        1
    );
}

function createBgRect(layer, options) {
  const container = layer.parentGroup();
  const x = layer.frame().x();
  const y = layer.frame().y();
  const width  = layer.frame().width();
  const height = layer.frame().height();

  // Create rectangle
  const rect   = MSRectangleShape.alloc().init();
  rect.frame = MSRect.rectWithRect(NSMakeRect(x, y, width, height));

  // Add default styling
  const bg = MSShapeGroup.shapeWithPath(rect);
  bg.setName(BG_LAYER_NAME);

  if (options.bgColor) {
    const fill = bg.style().addStylePartOfType(0);
    fill.color = MSImmutableColor.colorWithSVGString(options.bgColor);
  }

  container.removeLayer(layer);

  const group = MSLayerGroup.new();
  group.setName(layer.name());
  group.addLayers([bg, layer]);
  container.addLayers([group]);

  group.resizeToFitChildrenWithOption(0);

  // Select group
  group.select_byExpandingSelection(true, false);
}
