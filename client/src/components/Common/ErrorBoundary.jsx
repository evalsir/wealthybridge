import React from 'react';
import { useTranslation } from 'react-i18next';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">{t('error.title')}</h1>
            <p className="text-gray-600">{t('error.message')}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundaryWithTranslation(props) {
  const { t } = useTranslation();
  return <ErrorBoundary t={t} {...props} />;
}