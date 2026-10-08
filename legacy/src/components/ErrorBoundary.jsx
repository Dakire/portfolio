import { Component } from 'react';

// Isole une zone interactive : si elle plante, le reste de la page (déjà pré-rendue) reste utilisable.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <p role="alert" className="text-sm font-medium text-red-300">{this.props.fallback}</p> : this.props.children;
  }
}
