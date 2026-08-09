-- ============================================================
-- WMove — Seed de desenvolvimento
-- ============================================================

insert into public.vehicles (plate, brand, model, year, color, fuel_type, daily_rate, status, mileage) values
  ('ABC-1234', 'Toyota',    'Corolla',  2022, 'Prata',  'Flex',    150.00, 'available',  32000),
  ('DEF-5678', 'Volkswagen','Polo',     2023, 'Branco', 'Flex',    120.00, 'available',  18000),
  ('GHI-9012', 'Hyundai',   'HB20',    2021, 'Preto',  'Flex',    100.00, 'rented',     54000),
  ('JKL-3456', 'Jeep',      'Compass', 2023, 'Cinza',  'Flex',    220.00, 'available',  12000),
  ('MNO-7890', 'Fiat',      'Argo',    2022, 'Vermelho','Flex',   110.00, 'maintenance', 41000);

insert into public.customers (name, cpf, email, phone, cnh, cnh_expiry) values
  ('Carlos Silva',  '111.222.333-44', 'carlos@email.com',  '(31) 98765-0001', '12345678901', '2027-06-15'),
  ('Ana Oliveira',  '222.333.444-55', 'ana@email.com',     '(31) 98765-0002', '23456789012', '2026-11-20'),
  ('Marcos Souza',  '333.444.555-66', 'marcos@email.com',  '(31) 98765-0003', '34567890123', '2028-03-10');
