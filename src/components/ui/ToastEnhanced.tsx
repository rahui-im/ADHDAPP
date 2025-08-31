import { Toaster, toast, ToastOptions } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from './Icons';

// Custom toast component
interface CustomToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
}

function CustomToast({ message, type, action }: CustomToastProps) {
  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
    error: <XCircleIcon className="w-5 h-5 text-red-500" />,
    info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
    warning: <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />,
  };
  
  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-start gap-3 p-4 rounded-lg border ${colors[type]} shadow-lg`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-900 dark:text-white">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => toast.dismiss()}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Toast utility functions
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && <CustomToast message={message} type="success" />}
        </AnimatePresence>
      ),
      options
    );
  },
  
  error: (message: string, action?: { label: string; onClick: () => void }, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && <CustomToast message={message} type="error" action={action} />}
        </AnimatePresence>
      ),
      options
    );
  },
  
  info: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && <CustomToast message={message} type="info" />}
        </AnimatePresence>
      ),
      options
    );
  },
  
  warning: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && <CustomToast message={message} type="warning" />}
        </AnimatePresence>
      ),
      options
    );
  },
  
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// Toast container component
export function ToastContainerEnhanced() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    />
  );
}