import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-muted-foreground"
  >
    <motion.path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      initial={false}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
    <motion.circle
      cx="12"
      cy="12"
      r="3"
      initial={false}
      animate={{ scale: open ? 1 : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 300 }}
    />
    <AnimatePresence>
      {!open && (
        <motion.line
          x1="1"
          y1="1"
          x2="23"
          y2="23"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          exit={{ pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
        />
      )}
    </AnimatePresence>
  </svg>
);

const PasswordInput = ({ value, onChange, placeholder = '••••••••', className = '', id, required }: PasswordInputProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`pr-12 ${className}`}
      />
      <motion.button
        type="button"
        onClick={() => setShow(!show)}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-secondary/80 transition-colors"
        aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        <EyeIcon open={show} />
      </motion.button>
    </div>
  );
};

export default PasswordInput;
