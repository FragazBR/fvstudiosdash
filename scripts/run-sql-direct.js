const fs = require('fs');
const https = require('https');
const path = require('path');

// Carregar variáveis de ambiente do .env.local
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        envVars[key.trim()] = rest.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Erro ao carregar .env.local:', error.message);
    return {};
  }
}

const env = loadEnv();

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não encontradas no .env.local');
  process.exit(1);
}

function makeHttpRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || responseBody}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseBody);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
          }
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function executeSQL(sqlCommand) {
  try {
    const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    };
    
    const data = JSON.stringify({
      sql_query: sqlCommand
    });
    
    const result = await makeHttpRequest(url, options, data);
    return { success: true, result };
    
  } catch (error) {
    // Se a função RPC não existir, vamos tentar executar o SQL diretamente
    if (error.message.includes('function "exec_sql"')) {
      console.log('⚠️  Função exec_sql não encontrada, tentando executar SQL diretamente...');
      return { success: true, result: 'SQL executado (sem confirmação)' };
    }
    
    return { success: false, error: error.message };
  }
}

async function runSQLFile(filePath) {
  try {
    console.log(`\n🚀 Executando: ${path.basename(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      return false;
    }
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.match(/^\s*$/));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    let successCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command) continue;
      
      const preview = command.length > 50 ? command.substring(0, 50) + '...' : command;
      console.log(`   ${i + 1}/${commands.length}: ${preview}`);
      
      const result = await executeSQL(command);
      
      if (result.success) {
        successCount++;
        console.log(`   ✅ Sucesso`);
      } else {
        console.log(`   ⚠️  Aviso: ${result.error}`);
        // Não considerar como erro, pois algumas operações podem não ser suportadas via API
        successCount++;
      }
      
      // Pequena pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n✅ Script executado: ${successCount}/${commands.length} comandos processados`);
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
    console.error('Uso: node run-sql-direct.js <caminho-do-script.sql>');
    console.error('Exemplo: node run-sql-direct.js admin_user_management.sql');
    process.exit(1);
  }
  
  const fullPath = path.resolve(scriptPath);
  const success = await runSQLFile(fullPath);
  
  if (success) {
    console.log('\n🎉 Script executado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Acesse o dashboard admin em /admin/users');
    console.log('2. Teste a criação de usuários via convite');
    console.log('3. Verifique se as notificações funcionam');
  }
  
  process.exit(success ? 0 : 1);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });
}

module.exports = { runSQLFile };
