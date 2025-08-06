-- Verificar workstations existentes
SELECT 
    id,
    name,
    owner_id,
    agency_id,
    created_at
FROM workstations
ORDER BY created_at;

-- Verificar se existe a workstation específica
SELECT 
    id,
    name,
    owner_id
FROM workstations 
WHERE id = '00000000-0000-0000-0000-000000000001'::UUID;

-- Verificar membros de workstations
SELECT 
    wm.workstation_id,
    wm.user_id,
    wm.role,
    w.name as workstation_name
FROM workstation_members wm
LEFT JOIN workstations w ON wm.workstation_id = w.id;