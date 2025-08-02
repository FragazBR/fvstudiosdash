const fs = require('fs');
const path = require('path');

const files = [
  'app/api/websocket/stats/route.ts',
  'app/api/websocket/rooms/route.ts',
  'app/api/templates/[id]/route.ts',
  'app/api/templates/[id]/render/route.ts',
  'app/api/templates/[id]/preview/route.ts',
  'app/api/templates/[id]/duplicate/route.ts',
  'app/api/templates/variables/route.ts',
  'app/api/templates/route.ts',
  'app/api/templates/elements/route.ts',
  'app/api/templates/categories/route.ts',
  'app/api/realtime/notifications/subscribe/route.ts',
  'app/api/realtime/notifications/stats/route.ts',
  'app/api/realtime/notifications/sse/route.ts',
  'app/api/realtime/notifications/preferences/route.ts',
  'app/api/realtime/notifications/events/route.ts'
];

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix import statement
    content = content.replace(
      /import { createServerSupabaseClient } from '@\/lib\/supabaseServer'/g,
      "import { supabaseServer } from '@/lib/supabaseServer'"
    );
    
    // Fix usage pattern
    content = content.replace(
      /const supabase = createServerSupabaseClient\(\{ cookies \}\);/g,
      'const supabase = await supabaseServer();'
    );
    
    content = content.replace(
      /const supabase = createServerSupabaseClient\(\);/g,
      'const supabase = await supabaseServer();'
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⚪ No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
});

console.log('✅ All imports fixed!');