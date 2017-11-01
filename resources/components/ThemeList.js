import React from "react";
import ReactDOM from "react-dom";
import hljsThemes from "../../src/hljs-themes.json";
import { THEMES, PRETTY_THEME_NAMES_MAP } from '../constants';

export default class ThemeList extends React.Component {
  constructor() {
      super(...arguments);

      this.state = {
          searchValue: '',
          luminosity: 'dark',
      }

      this.filteredThemes = THEMES.filter((theme) => hljsThemes[theme].isDark);

      this.onClick = this.onClick.bind(this);
      this.onSearch = this.onSearch.bind(this);
      this.onLuminosityChange = this.onLuminosityChange.bind(this);
  }

  componentWillUpdate(nextProps, nextState) {
      const luminosityChanged = this.state.luminosity !== nextState.luminosity;
      const searchChanged = this.state.searchValue !== nextState.searchValue;

      if (luminosityChanged || searchChanged) {
          this.filterThemes(nextState);
      }

      if (luminosityChanged && this.filteredThemes.length) {
          this.props.onThemeSelected(this.filteredThemes[0]);
      }
  }

  componentDidMount() {
      setTimeout(() => {
          this.refs.search && this.refs.search.focus();
      });

      document.body.addEventListener('keydown', (event) => {
          const keyCode = event.keyCode;
          const arrow = {
              left: keyCode === 37,
              up: keyCode === 38,
              right: keyCode === 39,
              down: keyCode === 40,
          }

          if (this.state.searchValue.length && (arrow.left || arrow.right) && event.target.matches('input, textarea')) {
              return;
          }

          if (arrow.left || arrow.up || arrow.right || arrow.down) {
              event.preventDefault();

              arrow.left && this.setState({ luminosity: 'dark' });
              arrow.right && this.setState({ luminosity: 'light' });
              arrow.up && this.prevTheme();;
              arrow.down && this.nextTheme();;

              mixpanel.track('Arrow Navigation', { direction: Object.keys(arrow).find((key) => arrow[key]) });
          }
      });
  }

  onClick(e) {
      const theme = e.target.getAttribute('data-value');
      this.props.onThemeSelected(theme);
  }

  filterThemes({ searchValue, luminosity } = this.state) {
      this.filteredThemes = THEMES.filter((theme) => {
          const isDark = hljsThemes[theme].isDark;
          const matches = !searchValue || theme.toLowerCase().indexOf(searchValue.toLowerCase()) > -1;

          if (matches && luminosity === 'dark' && isDark) {
              return true;
          } else if (matches && luminosity === 'light' && !isDark) {
              return true;
          }

          return false;
      });
  }

  onSearch(e) {
      const query = e.target.value;

      this.setState({
          searchValue: query
      });

      mixpanel.track('Search', { query: query });
  }

  onLuminosityChange(e) {
      const luminosity = e.target.getAttribute('data-value');

      mixpanel.track('Theme Luminosity Changed', { luminosity: luminosity });

      this.setState({ luminosity: luminosity });
  }

  scrollItemIntoView(theme) {
      const li = this.refs.list.querySelector(`li[data-value="${theme}"]`);

      li && li.scrollIntoView(false);
  }

  nextTheme() {
      const currentIndex = this.filteredThemes.indexOf(this.props.selected);
      const nextIndex = Math.min(this.filteredThemes.length - 1, currentIndex + 1);
      const theme = this.filteredThemes[nextIndex];

      this.props.onThemeSelected(theme);
      this.scrollItemIntoView(theme);
  }

  prevTheme() {
      const currentIndex = this.filteredThemes.indexOf(this.props.selected);
      const nextIndex = Math.max(0, currentIndex - 1);
      const theme = this.filteredThemes[nextIndex];

      this.props.onThemeSelected(theme);
      this.scrollItemIntoView(theme);
  }

  render() {
      const themes = this.filteredThemes.map((theme, i) => {
          let className = `ThemeList-listItem ${theme == this.props.selected ? 'is-active' : ''}`;

          return (
              <li
                  onClick={this.onClick}
                  data-value={theme}
                  className={className}
                  key={i}>
                      {PRETTY_THEME_NAMES_MAP[theme]}
              </li>
          );
      });

      return(
          <div className="ThemeList">
              <div className="ThemeList-segmentedControl">
                  <nav className="SegmentedControl">
                      <button data-value="dark" onClick={this.onLuminosityChange} className={this.state.luminosity === 'dark' ? 'is-active' : ''}>Dark</button>
                      <button data-value="light" onClick={this.onLuminosityChange} className={this.state.luminosity === 'light' ? 'is-active' : ''}>Ligth</button>
                  </nav>
              </div>
              <input ref="search" className="ThemeList-search" type="search" placeholder="Search..." value={this.state.searchValue} onChange={this.onSearch} autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
              <ul ref="list" className="ThemeList-list">
                  { themes }
              </ul>
          </div>
      );
  }
}
