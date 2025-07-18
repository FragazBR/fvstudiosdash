#!/usr/bin/env node

/**
 * Script de Verificação da Configuração do Supabase
 * Execute: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuração do FVSTUDIOS Dashboard...\n');

// Verificar arquivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
let envExists = false;
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  envExists = true;
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  
  supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
  supabaseKey = keyMatch ? keyMatch[1].trim() : '';
}

// Verificar arquivos essenciais
const essentialFiles = [
  'supabase/migrations/001_complete_schema.sql',
  'supabase/seed.sql',
  'lib/supabaseBrowser.ts',
  'lib/supabaseServer.ts',
  'middleware.ts'
];

console.log('📁 Verificando arquivos essenciais:');
essentialFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🔐 Verificando configuração de ambiente:');
console.log(`${envExists ? '✅' : '❌'} Arquivo .env.local existe`);

if (envExists) {
  const urlValid = supabaseUrl && supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('[');
  const keyValid = supabaseKey && supabaseKey.startsWith('eyJ') && !supabaseKey.includes('[');
  
  console.log(`${urlValid ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL configurado`);
  console.log(`${keyValid ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_ANON_KEY configurado`);
  
  if (urlValid && keyValid) {
    console.log('\n🎉 Configuração parece estar correta!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Execute: pnpm dev');
    console.log('2. Acesse: http://localhost:3000/signup');
    console.log('3. Crie uma conta de teste');
    console.log('4. Verifique se funciona corretamente');
  } else {
    console.log('\n⚠️  Configure as credenciais do Supabase no arquivo .env.local');
  }
} else {
  console.log('\n❌ Arquivo .env.local não encontrado!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Copie .env.template para .env.local');
  console.log('2. Configure suas credenciais do Supabase');
  console.log('3. Execute este script novamente');
}

console.log('\n📚 Documentação:');
console.log('- Guia completo: SUPABASE_SETUP.md');
console.log('- Desenvolvimento: DEVELOPMENT.md');
console.log('- Resumo executivo: EXECUTIVE-SUMMARY.md');

console.log('\n🆘 Suporte:');
console.log('- Se tiver problemas, consulte SUPABASE_SETUP.md');
console.log('- Verifique se todas as tabelas foram criadas no Supabase');
console.log('- Limpe cookies do navegador se houver erros de autenticação');
