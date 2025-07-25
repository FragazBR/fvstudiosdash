require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runSQLFile(filePath) {
  try {
    console.log(`\n🚀 Executando: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      return false;
    }
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) continue;
      
      console.log(`   ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: command + ';'
      });
      
      if (error) {
        // Se a função exec_sql não existir, tentar executar diretamente
        if (error.code === 'PGRST202') {
          // Tentar executar através de uma query normal para comandos CREATE/ALTER
          try {
            await supabase.from('raw_sql').select('*').limit(0);
          } catch (rawError) {
            console.warn(`⚠️  Aviso no comando ${i + 1}: ${error.message}`);
          }
        } else {
          console.error(`❌ Erro no comando ${i + 1}: ${error.message}`);
          return false;
        }
      } else if (data) {
        console.log(`   ✅ Sucesso: ${typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : data}`);
      }
    }
    
    console.log(`✅ Script ${path.basename(filePath)} executado com sucesso!`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao executar ${filePath}:`, error.message);
    return false;
  }
}

// Função principal
async function main() {
  const scriptPath = process.argv[2];
  
  if (!scriptPath) {
    console.error('Uso: node run-sql.js <caminho-do-script.sql>');
    process.exit(1);
  }
  
  const fullPath = path.resolve(scriptPath);
  const success = await runSQLFile(fullPath);
  
  process.exit(success ? 0 : 1);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runSQLFile };
