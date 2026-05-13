import { Form, Head, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-4">
            <Head title="Masuk | SADESA" />

            <div className="w-full max-w-sm">
                {/* Logo & Title */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
                        <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-white" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">SADESA</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Sistem Administrasi Desa Cirangkong</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <h2 className="mb-1 text-lg font-semibold text-foreground">Masuk ke Akun</h2>
                    <p className="mb-6 text-sm text-muted-foreground">Masukkan email dan kata sandi Anda</p>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                {/* Email */}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">Alamat Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="nama@contoh.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password */}
                                <div className="grid gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Kata Sandi</Label>
                                        {canResetPassword && (
                                            <Link
                                                href={request()}
                                                className="text-xs text-teal-600 hover:underline"
                                                tabIndex={5}
                                            >
                                                Lupa kata sandi?
                                            </Link>
                                        )}
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Kata sandi"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                {/* Remember me */}
                                <div className="flex items-center gap-2">
                                    <Checkbox id="remember" name="remember" tabIndex={3} />
                                    <Label htmlFor="remember" className="cursor-pointer font-normal">
                                        Ingat saya
                                    </Label>
                                </div>

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    tabIndex={4}
                                    disabled={processing}
                                    className="w-full bg-teal-600 hover:bg-teal-700"
                                >
                                    {processing && <Spinner />}
                                    Masuk
                                </Button>

                                {canRegister && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        Belum punya akun?{' '}
                                        <Link href={register()} className="font-medium text-teal-600 hover:underline" tabIndex={6}>
                                            Daftar sekarang
                                        </Link>
                                    </p>
                                )}
                            </>
                        )}
                    </Form>

                    {status && (
                        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700">
                            {status}
                        </p>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Pemerintah Desa Cirangkong
                </p>
            </div>
        </div>
    );
}
