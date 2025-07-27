import { EventEmitter } from 'events';
import { createServerSupabaseClient } from './supabase';

// Types para sistema de subscriptions
export interface NotificationSubscription {
  id: string;
  user_id: string;
  agency_id?: string;
  event_types: string[];
  channels: ('web' | 'push' | 'email' | 'sms' | 'whatsapp' | 'slack')[];
  filters: Record<string, any>;
  priority_threshold: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  enabled: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with';
  value: any;
}

export interface SubscriptionRule {
  id: string;
  name: string;
  description?: string;
  event_types: string[];
  conditions: SubscriptionFilter[];
  actions: NotificationAction[];
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  enabled: boolean;
  agency_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationAction {
  type: 'send_notification' | 'send_email' | 'send_sms' | 'send_whatsapp' | 'create_task' | 'webhook';
  config: Record<string, any>;
  delay_seconds?: number;
  retry_config?: {
    max_retries: number;
    retry_delay: number;
    backoff_multiplier: number;
  };
}

export interface EventMatchResult {
  matches: boolean;
  subscription: NotificationSubscription;
  matched_filters: string[];
  score: number;
}

// Classe principal para gerenciar subscriptions
export class NotificationSubscriptionManager extends EventEmitter {
  private static instance: NotificationSubscriptionManager;
  private subscriptions: Map<string, NotificationSubscription[]> = new Map();
  private rules: Map<string, SubscriptionRule[]> = new Map();
  private processingQueue: Map<string, any[]> = new Map();

  private constructor() {
    super();
    this.startPeriodicSync();
  }

  public static getInstance(): NotificationSubscriptionManager {
    if (!NotificationSubscriptionManager.instance) {
      NotificationSubscriptionManager.instance = new NotificationSubscriptionManager();
    }
    return NotificationSubscriptionManager.instance;
  }

  // Criar nova subscription
  async createSubscription(
    userId: string,
    subscriptionData: Partial<NotificationSubscription>
  ): Promise<string | null> {
    try {
      const supabase = createServerSupabaseClient();

      const subscription = {
        user_id: userId,
        event_types: subscriptionData.event_types || ['all'],
        channels: subscriptionData.channels || ['web', 'push'],
        filters: subscriptionData.filters || {},
        priority_threshold: subscriptionData.priority_threshold || 'normal',
        enabled: subscriptionData.enabled !== false,
        agency_id: subscriptionData.agency_id || null,
        metadata: subscriptionData.metadata || {}
      };

      const { data, error } = await supabase
        .from('notification_subscriptions_advanced')
        .insert(subscription)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar subscription:', error);
        return null;
      }

      // Atualizar cache local
      await this.syncUserSubscriptions(userId);

      this.emit('subscription_created', {
        subscription: data,
        userId
      });

      return data.id;

    } catch (error) {
      console.error('Erro no createSubscription:', error);
      return null;
    }
  }

  // Atualizar subscription existente
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<NotificationSubscription>
  ): Promise<boolean> {
    try {
      const supabase = createServerSupabaseClient();

      const { data, error } = await supabase
        .from('notification_subscriptions_advanced')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar subscription:', error);
        return false;
      }

      // Atualizar cache local
      await this.syncUserSubscriptions(data.user_id);

      this.emit('subscription_updated', {
        subscription: data,
        updates
      });

      return true;

    } catch (error) {
      console.error('Erro no updateSubscription:', error);
      return false;
    }
  }

  // Deletar subscription
  async deleteSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const supabase = createServerSupabaseClient();

      // Buscar dados da subscription antes de deletar
      const { data: subscription } = await supabase
        .from('notification_subscriptions_advanced')
        .select('user_id')
        .eq('id', subscriptionId)
        .single();

      const { error } = await supabase
        .from('notification_subscriptions_advanced')
        .delete()
        .eq('id', subscriptionId);

      if (error) {
        console.error('Erro ao deletar subscription:', error);
        return false;
      }

      // Atualizar cache local
      if (subscription) {
        await this.syncUserSubscriptions(subscription.user_id);
      }

      this.emit('subscription_deleted', {
        subscriptionId,
        userId: subscription?.user_id
      });

      return true;

    } catch (error) {
      console.error('Erro no deleteSubscription:', error);
      return false;
    }
  }

  // Obter subscriptions de um usuário
  async getUserSubscriptions(userId: string): Promise<NotificationSubscription[]> {
    try {
      // Verificar cache primeiro
      if (this.subscriptions.has(userId)) {
        return this.subscriptions.get(userId)!;
      }

      // Buscar do banco
      await this.syncUserSubscriptions(userId);
      return this.subscriptions.get(userId) || [];

    } catch (error) {
      console.error('Erro no getUserSubscriptions:', error);
      return [];
    }
  }

  // Sincronizar subscriptions do usuário
  private async syncUserSubscriptions(userId: string): Promise<void> {
    try {
      const supabase = createServerSupabaseClient();

      const { data, error } = await supabase
        .from('notification_subscriptions_advanced')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao sincronizar subscriptions:', error);
        return;
      }

      this.subscriptions.set(userId, data || []);

    } catch (error) {
      console.error('Erro no syncUserSubscriptions:', error);
    }
  }

  // Criar regra de subscription
  async createSubscriptionRule(
    createdBy: string,
    ruleData: Partial<SubscriptionRule>
  ): Promise<string | null> {
    try {
      const supabase = createServerSupabaseClient();

      const rule = {
        name: ruleData.name || 'Nova Regra',
        description: ruleData.description,
        event_types: ruleData.event_types || [],
        conditions: ruleData.conditions || [],
        actions: ruleData.actions || [],
        priority: ruleData.priority || 'normal',
        enabled: ruleData.enabled !== false,
        agency_id: ruleData.agency_id || null,
        created_by: createdBy
      };

      const { data, error } = await supabase
        .from('notification_subscription_rules')
        .insert(rule)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar regra:', error);
        return null;
      }

      // Atualizar cache local
      await this.syncAgencyRules(rule.agency_id);

      this.emit('rule_created', {
        rule: data,
        createdBy
      });

      return data.id;

    } catch (error) {
      console.error('Erro no createSubscriptionRule:', error);
      return null;
    }
  }

  // Sincronizar regras da agência
  private async syncAgencyRules(agencyId?: string): Promise<void> {
    try {
      const supabase = createServerSupabaseClient();
      const cacheKey = agencyId || 'global';

      const { data, error } = await supabase
        .from('notification_subscription_rules')
        .select('*')
        .eq('agency_id', agencyId || null)
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao sincronizar regras:', error);
        return;
      }

      this.rules.set(cacheKey, data || []);

    } catch (error) {
      console.error('Erro no syncAgencyRules:', error);
    }
  }

  // Processar evento e encontrar subscriptions correspondentes
  async processEvent(
    eventType: string,
    eventData: Record<string, any>,
    userId: string,
    agencyId?: string
  ): Promise<EventMatchResult[]> {
    try {
      // Obter subscriptions do usuário
      const userSubscriptions = await this.getUserSubscriptions(userId);
      
      // Obter regras aplicáveis
      const agencyRules = this.rules.get(agencyId || 'global') || [];
      const globalRules = agencyId ? (this.rules.get('global') || []) : [];
      const applicableRules = [...agencyRules, ...globalRules];

      const results: EventMatchResult[] = [];

      // Verificar subscriptions diretas do usuário
      for (const subscription of userSubscriptions) {
        const matchResult = this.evaluateSubscription(
          subscription,
          eventType,
          eventData
        );
        
        if (matchResult.matches) {
          results.push(matchResult);
        }
      }

      // Verificar regras automáticas
      for (const rule of applicableRules) {
        if (this.evaluateRule(rule, eventType, eventData)) {
          // Aplicar ações da regra
          await this.executeRuleActions(rule, eventData, userId, agencyId);
        }
      }

      // Ordenar por score (relevância)
      results.sort((a, b) => b.score - a.score);

      this.emit('event_processed', {
        eventType,
        eventData,
        userId,
        agencyId,
        matches: results.length,
        results
      });

      return results;

    } catch (error) {
      console.error('Erro no processEvent:', error);
      return [];
    }
  }

  // Avaliar se uma subscription corresponde ao evento
  private evaluateSubscription(
    subscription: NotificationSubscription,
    eventType: string,
    eventData: Record<string, any>
  ): EventMatchResult {
    let score = 0;
    const matchedFilters: string[] = [];

    // Verificar tipo de evento
    const eventMatches = subscription.event_types.includes('all') || 
                        subscription.event_types.includes(eventType);
    
    if (!eventMatches) {
      return {
        matches: false,
        subscription,
        matched_filters: [],
        score: 0
      };
    }

    score += 10; // Base score para match de evento

    // Verificar filtros
    for (const [filterKey, filterValue] of Object.entries(subscription.filters)) {
      if (this.evaluateFilter(filterKey, filterValue, eventData)) {
        matchedFilters.push(filterKey);
        score += 5;
      } else if (subscription.filters[filterKey] !== undefined) {
        // Se tem filtro específico mas não passou, não é match
        return {
          matches: false,
          subscription,
          matched_filters: [],
          score: 0
        };
      }
    }

    // Verificar threshold de prioridade
    const eventPriority = eventData.priority || 'normal';
    const priorityValues = { low: 1, normal: 2, high: 3, urgent: 4, critical: 5 };
    
    const eventPriorityValue = priorityValues[eventPriority as keyof typeof priorityValues] || 2;
    const thresholdValue = priorityValues[subscription.priority_threshold] || 2;

    if (eventPriorityValue < thresholdValue) {
      return {
        matches: false,
        subscription,
        matched_filters: [],
        score: 0
      };
    }

    score += eventPriorityValue * 2; // Bonus por prioridade

    return {
      matches: true,
      subscription,
      matched_filters: matchedFilters,
      score
    };
  }

  // Avaliar filtro individual
  private evaluateFilter(
    filterKey: string,
    filterConfig: any,
    eventData: Record<string, any>
  ): boolean {
    const eventValue = this.getNestedValue(eventData, filterKey);
    
    if (typeof filterConfig === 'string' || typeof filterConfig === 'number' || typeof filterConfig === 'boolean') {
      return eventValue === filterConfig;
    }

    if (Array.isArray(filterConfig)) {
      return filterConfig.includes(eventValue);
    }

    if (typeof filterConfig === 'object' && filterConfig.operator) {
      const { operator, value } = filterConfig;
      
      switch (operator) {
        case 'eq': return eventValue === value;
        case 'ne': return eventValue !== value;
        case 'gt': return eventValue > value;
        case 'gte': return eventValue >= value;
        case 'lt': return eventValue < value;
        case 'lte': return eventValue <= value;
        case 'in': return Array.isArray(value) && value.includes(eventValue);
        case 'not_in': return Array.isArray(value) && !value.includes(eventValue);
        case 'contains': return String(eventValue).includes(String(value));
        case 'starts_with': return String(eventValue).startsWith(String(value));
        case 'ends_with': return String(eventValue).endsWith(String(value));
        default: return false;
      }
    }

    return false;
  }

  // Obter valor aninhado de objeto
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Avaliar regra
  private evaluateRule(
    rule: SubscriptionRule,
    eventType: string,
    eventData: Record<string, any>
  ): boolean {
    // Verificar tipo de evento
    if (!rule.event_types.includes('all') && !rule.event_types.includes(eventType)) {
      return false;
    }

    // Verificar todas as condições
    return rule.conditions.every(condition => 
      this.evaluateFilter(condition.field, {
        operator: condition.operator,
        value: condition.value
      }, eventData)
    );
  }

  // Executar ações da regra
  private async executeRuleActions(
    rule: SubscriptionRule,
    eventData: Record<string, any>,
    userId: string,
    agencyId?: string
  ): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, eventData, userId, agencyId, rule);
      } catch (error) {
        console.error(`Erro ao executar ação ${action.type}:`, error);
      }
    }
  }

  // Executar ação individual
  private async executeAction(
    action: NotificationAction,
    eventData: Record<string, any>,
    userId: string,
    agencyId?: string,
    rule?: SubscriptionRule
  ): Promise<void> {
    const delay = action.delay_seconds || 0;

    const executeNow = async () => {
      switch (action.type) {
        case 'send_notification':
          // Integrar com sistema de notificações
          this.emit('action_send_notification', {
            userId,
            agencyId,
            eventData,
            config: action.config,
            rule
          });
          break;

        case 'send_email':
          this.emit('action_send_email', {
            userId,
            agencyId,
            eventData,
            config: action.config,
            rule
          });
          break;

        case 'webhook':
          this.emit('action_webhook', {
            userId,
            agencyId,
            eventData,
            config: action.config,
            rule
          });
          break;

        case 'create_task':
          this.emit('action_create_task', {
            userId,
            agencyId,
            eventData,
            config: action.config,
            rule
          });
          break;

        default:
          console.warn(`Ação não implementada: ${action.type}`);
      }
    };

    if (delay > 0) {
      setTimeout(executeNow, delay * 1000);
    } else {
      await executeNow();
    }
  }

  // Sincronização periódica
  private startPeriodicSync(): void {
    // Sincronizar cache a cada 5 minutos
    setInterval(() => {
      console.log('🔄 Sincronizando subscriptions...');
      // Poderia implementar lógica para ressincronizar usuários ativos
    }, 5 * 60 * 1000);
  }

  // Obter estatísticas
  async getSubscriptionStats(agencyId?: string): Promise<any> {
    try {
      const supabase = createServerSupabaseClient();

      const { data: stats, error } = await supabase.rpc('get_subscription_stats', {
        p_agency_id: agencyId || null
      });

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        return null;
      }

      return stats?.[0] || null;

    } catch (error) {
      console.error('Erro no getSubscriptionStats:', error);
      return null;
    }
  }

  // Cleanup
  destroy(): void {
    this.subscriptions.clear();
    this.rules.clear();
    this.processingQueue.clear();
    this.removeAllListeners();
    console.log('💀 NotificationSubscriptionManager destroyed');
  }
}

// Instância singleton
export const notificationSubscriptionManager = NotificationSubscriptionManager.getInstance();