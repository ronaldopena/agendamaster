import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';

const formSchema = z.object({
  nomeOrganizacao: z.string().min(3, 'Nome da clínica deve ter pelo menos 3 caracteres'),
  cnpj: z.string().optional(),
  nomeUsuario: z.string().min(3, 'Seu nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeOrganizacao: '',
      cnpj: '',
      nomeUsuario: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await authService.signUp({
        nomeOrganizacao: values.nomeOrganizacao,
        cnpj: values.cnpj,
        nomeUsuario: values.nomeUsuario,
        email: values.email,
        password: values.password,
      });

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login no sistema.",
      });

      navigate('/login');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Criar Nova Conta</CardTitle>
          <CardDescription>Cadastre sua clínica e comece a usar o Agenda Master</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <div className="space-y-4 border-b pb-4">
                <h3 className="font-semibold text-gray-700">Dados da Clínica</h3>
                <FormField
                  control={form.control}
                  name="nomeOrganizacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Clínica / Consultório</FormLabel>
                      <FormControl>
                        <Input placeholder="Clínica Saúde Total" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-gray-700">Dados do Administrador</h3>
                <FormField
                  control={form.control}
                  name="nomeUsuario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Acesso</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="joao@clinica.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Fazer Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
