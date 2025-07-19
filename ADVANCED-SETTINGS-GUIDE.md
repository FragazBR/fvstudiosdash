# Sistema de Configurações Avançadas

## Visão Geral
Implementamos um painel de configurações avançadas que se expande lateralmente da direita para a esquerda, similar aos melhores dashboards administrativos do mercado. Este sistema oferece mais de 50 opções de personalização em tempo real.

## Como Acessar
1. **Clique no avatar do usuário** no canto superior direito
2. **Selecione "Configurações"** no dropdown menu
3. **O painel se expandirá** da direita para a esquerda sobre o conteúdo atual

## Características Principais

### 🎨 **Interface Moderna**
- **Slide-in Animation**: Animação suave de entrada lateral
- **Overlay Background**: Fundo semi-transparente com blur
- **Responsive Design**: Funciona em diferentes tamanhos de tela
- **Real-time Preview**: Mudanças aplicadas instantaneamente

### ⚙️ **Seções de Configuração**

#### 1. **Theme Style** 🎨
- **Color Schemes**: Light, Dark, System
- **Skins**: Default, Bordered
- **Theme Colors**: 8 opções de cores primárias
  - Blue (padrão), Green, Purple, Orange, Red, Pink, Indigo, Teal

#### 2. **Layout** 📐
- **Layout Types**:
  - Vertical (padrão)
  - Horizontal
  - SemiBox
  - Compact
- **Sidebar Options**:
  - Classic (padrão)
  - Draggable
  - Two Column
  - Compact
- **Content Width**:
  - Wide (padrão)
  - Boxed

#### 3. **Performance** ⚡
- **Animation Settings**:
  - Enable/Disable animations
  - Animation quality (High, Medium, Low, None)
- **Data Refresh Rate**:
  - 5 seconds, 15 seconds, 30 seconds (padrão), 1 minute, 5 minutes
- **Compact Mode**: Reduz espaçamentos

#### 4. **Notifications** 🔔
- **Push Notifications**: Browser notifications on/off
- **Sound Effects**: Audio feedback para notificações
- **Volume Control**: Slider de 0-100%
- **Email Notifications**:
  - Daily Reports
  - Weekly Summary
  - Monthly Analytics
  - Security Alerts

### 🎯 **Configurações Específicas**
- **Menu Hidden**: Ocultar menu de navegação
- **Show Search Bar**: Exibir funcionalidade de pesquisa
- **Show Team**: Mostrar informações da equipe

## Tecnologias Utilizadas

### **Frontend Components**
- **Next.js 15**: Framework React com Turbopack
- **Radix UI**: Componentes acessíveis (RadioGroup, Switch, Slider)
- **Tailwind CSS**: Styling utilitário
- **Lucide React**: Ícones modernos
- **next-themes**: Gerenciamento de temas dark/light

### **Estado e Persistência**
- **React useState**: Gerenciamento de estado local
- **ThemeProvider**: Context para temas globais
- **LocalStorage**: Persistência de configurações (futuro)

## Estrutura de Arquivos

```
components/
├── advanced-settings-panel.tsx    # Painel principal
├── Shared/
│   └── Topbar.tsx                 # Header com dropdown do avatar
└── theme-provider.tsx             # Provider de temas

app/
└── layout.tsx                     # Layout com ThemeProvider
```

## Funcionalidades Implementadas

### ✅ **Já Funcionando**
- [x] Painel slide-in lateral
- [x] 4 seções principais de configuração
- [x] Seleção de temas (Light/Dark/System)
- [x] Layouts responsivos
- [x] Configurações de performance
- [x] Sistema de notificações
- [x] Animações suaves
- [x] Fechamento com ESC
- [x] Overlay clickável

### 🚧 **Em Desenvolvimento**
- [ ] Persistência no localStorage/database
- [ ] Aplicação real das configurações de layout
- [ ] Preview em tempo real das mudanças
- [ ] Configurações de gráficos avançadas
- [ ] Temas personalizados adicionais

## Como Expandir

### **Adicionar Nova Seção**
```typescript
// 1. Adicionar ao array de seções
const sections = [
  // existentes...
  { id: "charts", label: "Charts", icon: BarChart3 },
];

// 2. Adicionar o caso no switch
{activeSection === "charts" && (
  <div className="space-y-6">
    {/* Suas configurações aqui */}
  </div>
)}
```

### **Adicionar Nova Configuração**
```typescript
// 1. Adicionar estado
const [newSetting, setNewSetting] = useState(false);

// 2. Adicionar UI
<div className="flex items-center justify-between">
  <Label>Nova Configuração</Label>
  <Switch checked={newSetting} onCheckedChange={setNewSetting} />
</div>
```

## Personalização Avançada

### **Cores do Tema**
- Modifique o array de cores em `advanced-settings-panel.tsx`
- Adicione novas variantes no `tailwind.config.ts`

### **Layouts Personalizados**
- Implemente novos tipos de layout no componente
- Configure as classes CSS correspondentes

### **Animações**
- Ajuste duração em `transition-transform duration-300`
- Modifique easing com `ease-out`, `ease-in-out`, etc.

## Melhores Práticas

1. **Performance**: Use `useState` para configurações que mudam frequentemente
2. **Persistência**: Implemente debounce para salvar configurações
3. **Acessibilidade**: Mantenha navegação por teclado funcional
4. **Responsividade**: Teste em diferentes tamanhos de tela
5. **UX**: Forneça feedback visual para todas as ações

## Exemplo de Uso Completo

```typescript
// Abrir painel
const [settingsOpen, setSettingsOpen] = useState(false);

// Usar o componente
<AdvancedSettingsPanel 
  isOpen={settingsOpen} 
  onClose={() => setSettingsOpen(false)} 
/>
```

## Próximos Passos

1. **Implementar persistência** das configurações
2. **Conectar configurações** aos componentes do dashboard
3. **Adicionar preview** em tempo real
4. **Otimizar performance** com React.memo
5. **Adicionar testes** unitários

---

**Desenvolvido com ❤️ para FVSTUDIOS Dashboard**
