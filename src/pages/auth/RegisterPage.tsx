import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerWithEmail } from '@/services/api';

const perks = ['AI skin analysis', 'Personalized routines', 'Diet & beauty guidance'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (fullName.trim().length < 2) errors.fullName = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Use at least 8 characters.';
    if (password !== confirm) errors.confirm = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await registerWithEmail(email, password, fullName.trim());
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create your account.';
      if (message.toLowerCase().includes('already registered')) {
        setFormError('An account with this email already exists. Try signing in instead.');
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start understanding your skin with AI-powered analysis and routines."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-navy-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {formError}
          </div>
        )}
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldErrors.fullName}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
        />
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create account
        </Button>
        <ul className="space-y-2 pt-2">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-navy-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {p}
            </li>
          ))}
        </ul>
      </form>
    </AuthLayout>
  );
}
