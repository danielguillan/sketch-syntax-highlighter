import React from "react";
import ReactDOM from "react-dom";
import hljs from "highlight.js";
import pluginCall from "sketch-module-web-view/client";
import ThemeList from './components/ThemeList';
import SyntaxPreview from './components/SyntaxPreview';
import { THEMES, THEMES_INDEXES_MAP, PRETTY_THEME_NAMES_MAP, LANGUAGES, CAPITALIZED_LANGUAGES_MAP } from './constants';

let CODE_SNIPPET = '';

window.sketchBridge = function(payload) {
    CODE_SNIPPET = payload.source;
}

pluginCall('getSourceCode');

class App extends React.Component {
    constructor() {
        super(...arguments);

        this.state = {
            selectedTheme: THEMES[0],
            selectedLanguage: 'auto',
            highlightedCode: '',
            detectedLanguage: ''
        };

        this.onThemeSelected = this.onThemeSelected.bind(this);
        this.applyTheme = this.applyTheme.bind(this);
        this.onLanguageChange = this.onLanguageChange.bind(this);
        this.onEnterKeyDown = this.onEnterKeyDown.bind(this);
    }

    onEnterKeyDown(event) {
        const isEnterKey = event.keyCode === 13;

        if (isEnterKey) {
            mixpanel.track('Apply on Enter');

            event.preventDefault();
            this.applyTheme();
            document.body.removeEventListener('keydown', this.onEnterKeyDown);
        }
    }

    componentDidMount() {
        mixpanel.track('Run');

        this.highlight();

        document.body.addEventListener('keydown', this.onEnterKeyDown);
    }

    highlight(lang) {
        let result;

        if (!lang || lang === 'auto') {
            result = hljs.highlightAuto(CODE_SNIPPET);
        } else {
            result = hljs.highlight(lang, CODE_SNIPPET);
        }

        this.setState({
            highlightedCode: result.value,
            detectedLanguage: result.language,
        });
    }

    onThemeSelected(theme) {
        mixpanel.track('Theme selected', { theme: theme });

        this.setState({selectedTheme: theme});
    }

    onLanguageChange(e) {
        const lang = e.target.value;

        mixpanel.track('Language selected', { language: lang });

        this.setState({
            selectedLanguage: lang
        });

        this.highlight(lang);
    }

    applyTheme() {
        mixpanel.track('Apply', {
            language: this.state.selectedLanguage,
            detectedLanguage: this.state.detectedLanguage,
            theme: this.state.selectedTheme
        });

        pluginCall('applyTheme', this.state.selectedTheme);
    }

    cancel() {
        mixpanel.track('Cancel');
        pluginCall('close');
    }

    render() {
        return (
            <div className="App">
                <select className="LanguagePicker" value={this.state.selectedLanguage} onChange={this.onLanguageChange}>
                    <option key="auto" value="auto">Auto-detect</option>
                    {LANGUAGES.map((lang) => {
                        return <option key={lang} value={lang}>{CAPITALIZED_LANGUAGES_MAP[lang]}</option>
                    })}
                </select>
                <ThemeList
                    onThemeSelected={this.onThemeSelected}
                    selected={this.state.selectedTheme}
                    nextTheme={this.nextTheme}
                    prevTheme={this.prevTheme}
                />
                <SyntaxPreview theme={this.state.selectedTheme} codeSnippet={this.state.highlightedCode} />
                <div className="App-controls">
                    <button onClick={this.cancel}>Cancel</button>
                    <button className="primary" onClick={this.applyTheme}>Apply</button>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<App/>, document.getElementById("root"));
