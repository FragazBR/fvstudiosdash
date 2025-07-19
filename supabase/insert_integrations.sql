-- =============================================
-- INSERIR INTEGRAÇÕES NO CATÁLOGO
-- =============================================

-- Inserir integrações principais
INSERT INTO available_integrations (name, slug, description, type, auth_type, available_for_free, available_for_influencer) VALUES
-- Redes Sociais
('Instagram Business', 'instagram_business', 'Integração com Instagram Business API', 'social_media', 'oauth', false, true),
('Facebook Pages', 'facebook_pages', 'Gerenciamento de páginas do Facebook', 'social_media', 'oauth', false, true),
('TikTok Business', 'tiktok_business', 'TikTok for Business API', 'social_media', 'oauth', false, true),
('YouTube', 'youtube', 'YouTube Data API', 'social_media', 'oauth', false, true),
('Twitter/X', 'twitter', 'Twitter API v2', 'social_media', 'oauth', false, true),
('LinkedIn', 'linkedin', 'LinkedIn Marketing API', 'social_media', 'oauth', false, true),

-- Analytics
('Google Analytics', 'google_analytics', 'Google Analytics 4', 'analytics', 'oauth', false, true),
('Meta Pixel', 'meta_pixel', 'Facebook/Instagram Pixel', 'analytics', 'api_key', false, true),
('Google Tag Manager', 'google_tag_manager', 'Google Tag Manager', 'analytics', 'oauth', false, false),

-- Marketing
('Mailchimp', 'mailchimp', 'Email marketing com Mailchimp', 'marketing', 'oauth', true, false),
('RD Station', 'rd_station', 'Automação de marketing RD Station', 'marketing', 'oauth', false, false),
('HubSpot', 'hubspot', 'CRM e marketing HubSpot', 'marketing', 'oauth', false, false),

-- Design
('Canva', 'canva', 'Design gráfico com Canva', 'design', 'oauth', true, true),
('Adobe Creative Cloud', 'adobe_cc', 'Adobe Creative Cloud APIs', 'design', 'oauth', false, false),

-- IA
('OpenAI', 'openai', 'GPT e DALL-E', 'ai', 'api_key', false, false),
('Claude', 'claude', 'Anthropic Claude', 'ai', 'api_key', false, false),
('Google Gemini', 'google_gemini', 'Google Gemini AI', 'ai', 'api_key', false, false),

-- Storage
('Google Drive', 'google_drive', 'Google Drive API', 'storage', 'oauth', true, true),
('Dropbox', 'dropbox', 'Dropbox API', 'storage', 'oauth', true, false),
('AWS S3', 'aws_s3', 'Amazon S3 Storage', 'storage', 'api_key', false, false),

-- Pagamentos
('Stripe', 'stripe', 'Processamento de pagamentos', 'payment', 'api_key', false, false),
('PayPal', 'paypal', 'PayPal API', 'payment', 'oauth', false, false),
('Mercado Pago', 'mercado_pago', 'Mercado Pago API', 'payment', 'oauth', false, false);

SELECT '✅ 23 integrações adicionadas ao catálogo!' as status;
SELECT COUNT(*) as total_integracoes FROM available_integrations;
