import { useEffect } from 'react';

const ErrorHandler = ({ error, onRetry, onDismiss }) => {
  useEffect(() => {
    if (error) {
      console.error('Application Error:', error);
    }
  }, [error]);

  if (!error) return null;

  const getErrorDetails = (error) => {
    if (typeof error === 'string') {
      return { message: error, type: 'error' };
    }

    if (error.message?.includes('User rejected')) {
      return { 
        message: 'Transaction was cancelled by user', 
        type: 'warning',
        dismissible: true 
      };
    }
    if (error.message?.includes('insufficient funds')) {
      return { 
        message: 'Insufficient balance for transaction + gas fees', 
        type: 'error' 
      };
    }
    if (error.message?.includes('Poll ended')) {
      return { 
        message: 'This poll has ended and no longer accepts bets', 
        type: 'error' 
      };
    }
    if (error.message?.includes('Already resolved')) {
      return { 
        message: 'This poll has already been resolved', 
        type: 'error' 
      };
    }
    if (error.message?.includes('Poll not ended')) {
      return { 
        message: 'Poll must end before it can be resolved', 
        type: 'error' 
      };
    }
    if (error.message?.includes('Bet below $1')) {
      return { 
        message: 'Minimum bet is $1 USD equivalent in HBAR', 
        type: 'error' 
      };
    }
    if (error.message?.includes('network')) {
      return { 
        message: 'Please switch to the correct network', 
        type: 'warning' 
      };
    }
    if (error.message?.includes('gas')) {
      return { 
        message: 'Transaction failed due to gas estimation. Try reducing the amount.', 
        type: 'error' 
      };
    }

    return { 
      message: error.reason || error.message || 'Unknown error occurred', 
      type: 'error' 
    };
  };

  const { message, type, dismissible } = getErrorDetails(error);

  const bgColor = type === 'warning' ? 'bg-yellow-50' : 'bg-red-50';
  const borderColor = type === 'warning' ? 'border-yellow-200' : 'border-red-200';
  const textColor = type === 'warning' ? 'text-yellow-800' : 'text-red-800';
  const iconColor = type === 'warning' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
            {type === 'warning' ? (
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>
            {type === 'warning' ? 'Warning' : 'Error'}
          </h3>
          <p className={`mt-1 text-sm ${textColor}`}>{message}</p>
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`${bgColor} hover:${type === 'warning' ? 'bg-yellow-100' : 'bg-red-100'} ${textColor} font-medium py-1 px-3 rounded text-sm border ${borderColor}`}
              >
                Try Again
              </button>
            )}
            {(dismissible || onDismiss) && (
              <button
                onClick={onDismiss}
                className={`${textColor} hover:${type === 'warning' ? 'text-yellow-900' : 'text-red-900'} font-medium py-1 px-3 rounded text-sm`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandler;