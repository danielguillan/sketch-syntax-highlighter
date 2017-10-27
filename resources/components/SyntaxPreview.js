import React from "react";
import ReactDOM from "react-dom";

export default class SyntaxPreview extends React.Component {

      componentDidMount() {
          this.updateStyles();
      }

      componentWillReceiveProps(nextProps) {
          if (this.props.theme !== nextProps.theme) {
              this.updateStyles(nextProps.theme);
          }
      }

      updateStyles(theme = this.props.theme) {
          let style = document.getElementById('hljs-theme');

          if (!style) {
              const head = document.head;
              style = document.createElement('style');

              style.id = 'hljs-theme';
              style.type = 'text/css';

              head.appendChild(style);
          }

          style.innerText = require('!!raw-loader!highlight.js/styles/' + theme + '.css');
      }

      render() {
          return (
              <pre className="SyntaxPreview">
                  <code className="hljs" dangerouslySetInnerHTML={{__html: this.props.codeSnippet }} />
              </pre>
          );
      }
  }
