-- Create table for delivery control
CREATE TABLE public.controle_entregas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pv_foco TEXT,
  nf TEXT,
  valor NUMERIC DEFAULT 0,
  cliente TEXT,
  uf TEXT,
  data_saida DATE,
  motorista TEXT,
  carro TEXT,
  tipo_transporte TEXT,
  status TEXT DEFAULT 'PENDENTE',
  precisa_montagem BOOLEAN DEFAULT false,
  data_montagem DATE,
  montador_1 TEXT,
  montador_2 TEXT,
  gastos_entrega NUMERIC DEFAULT 0,
  gastos_montagem NUMERIC DEFAULT 0,
  produtividade NUMERIC DEFAULT 0,
  erros TEXT,
  percentual_gastos NUMERIC DEFAULT 0,
  descricao_erros TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.controle_entregas ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for this logistics system, we'll allow public access)
CREATE POLICY "Allow public read access" 
ON public.controle_entregas 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert" 
ON public.controle_entregas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update" 
ON public.controle_entregas 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete" 
ON public.controle_entregas 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_controle_entregas_updated_at
BEFORE UPDATE ON public.controle_entregas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.controle_entregas;