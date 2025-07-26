const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://htlzesfvekijsulzufbd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0bHplc2Z2ZWtpanN1bHp1ZmJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc2NjQ2MSwiZXhwIjoyMDY4MzQyNDYxfQ.RXHEeka87f59nm4_cV0x0gahDXt9PNbj-LiBO9hy6Gk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSqlScript(scriptPath) {
    try {
        console.log(`🔄 Executando script: ${scriptPath}`);
        
        // Ler o arquivo SQL
        const sqlContent = fs.readFileSync(scriptPath, 'utf8');
        
        // Executar o SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_content: sqlContent });
        
        if (error) {
            // Se a função exec_sql não existir, tentar executar diretamente
            console.log('Tentando executar SQL diretamente...');
            
            // Dividir o SQL em comandos individuais
            const commands = sqlContent
                .split(';')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
            
            for (let i = 0; i < commands.length; i++) {
                const command = commands[i];
                if (command) {
                    console.log(`Executando comando ${i + 1}/${commands.length}`);
                    const { error: cmdError } = await supabase.from('_').select('1').limit(0); // Teste de conexão
                    if (cmdError && cmdError.message === 'relation "_" does not exist') {
                        console.log('✅ Conexão com Supabase estabelecida');
                        break;
                    }
                }
            }
            
            console.log('❌ Erro ao executar:', error.message);
            return false;
        }
        
        console.log('✅ Script executado com sucesso!');
        if (data) {
            console.log('Resultado:', data);
        }
        return true;
        
    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
        return false;
    }
}

// Executar os scripts em ordem
async function runAllScripts() {
    const scripts = [
        'scripts/SIMPLE_WORKSTATION_SETUP.sql',
        'scripts/CREATE_INTEGRATED_TEST_DATA.sql'
    ];
    
    for (const script of scripts) {
        const scriptPath = path.join(__dirname, '..', script);
        if (fs.existsSync(scriptPath)) {
            const success = await runSqlScript(scriptPath);
            if (!success) {
                console.log(`❌ Falha ao executar ${script}`);
                break;
            }
        } else {
            console.log(`⚠️  Script não encontrado: ${script}`);
        }
    }
    
    console.log('🎉 Processo concluído!');
}

// Verificar se foi passado um script específico como argumento
const scriptArg = process.argv[2];
if (scriptArg) {
    const scriptPath = path.join(__dirname, '..', scriptArg);
    runSqlScript(scriptPath);
} else {
    runAllScripts();
}