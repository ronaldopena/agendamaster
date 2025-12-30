import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, nome, organizacao_id, tipo, unidade_padrao_id } = await req.json()

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome, organizacao_id }
    })

    if (authError) throw authError

    if (!authData.user) throw new Error('Usuário não criado')

    // 2. Criar perfil vinculado
    // Nota: Se a trigger de criação automática estiver ativa, isso pode duplicar ou falhar.
    // Vamos verificar se já existe perfil para este email (criado manualmente antes) e atualizar,
    // ou criar um novo.
    
    // Tenta buscar perfil existente por email
    const { data: existingProfile } = await supabaseClient
      .from('perfis')
      .select('id')
      .eq('email', email)
      .single()

    let profileResult

    if (existingProfile) {
      // Atualiza perfil existente com o novo usuario_id
      profileResult = await supabaseClient
        .from('perfis')
        .update({
          usuario_id: authData.user.id,
          nome,
          tipo,
          unidade_padrao_id: unidade_padrao_id || null,
          organizacao_id
        })
        .eq('id', existingProfile.id)
        .select()
        .single()
    } else {
      // Cria novo perfil
      profileResult = await supabaseClient
        .from('perfis')
        .insert({
          usuario_id: authData.user.id,
          nome,
          email,
          tipo,
          organizacao_id,
          unidade_padrao_id: unidade_padrao_id || null
        })
        .select()
        .single()
    }

    if (profileResult.error) {
      // Se falhar no perfil, deleta o usuário auth para manter consistência
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      throw profileResult.error
    }

    return new Response(
      JSON.stringify({ user: authData.user, perfil: profileResult.data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
