import React from "react";

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: err?.message || String(err) };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6 bg-red-50">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-red-700 mb-2">Se produjo un error en la UI</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
