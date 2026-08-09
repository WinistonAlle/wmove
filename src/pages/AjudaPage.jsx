import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/termos.css'
import '../styles/ajuda.css'

const CATEGORIES = [
  { id: 'conta',      label: 'Conta e cadastro',   icon: '👤' },
  { id: 'planos',     label: 'Planos e cobrança',   icon: '💳' },
  { id: 'frota',      label: 'Frota e veículos',    icon: '🚗' },
  { id: 'alugueis',   label: 'Aluguéis e contratos',icon: '📋' },
  { id: 'financeiro', label: 'Financeiro',           icon: '💰' },
  { id: 'seguranca',  label: 'Segurança e dados',   icon: '🔒' },
]

const FAQS = {
  conta: [
    {
      q: 'Como crio minha conta na WMove?',
      a: 'Acesse wmove.com.br, clique em "Criar conta grátis" e siga o cadastro de 3 passos: seus dados pessoais, os dados da empresa e o tamanho da sua frota. Você já terá acesso imediato por 14 dias sem precisar de cartão.',
    },
    {
      q: 'Posso ter mais de um usuário na minha conta?',
      a: 'Sim. O titular da conta pode convidar colaboradores em Configurações → Usuários. O número de usuários permitidos depende do plano contratado.',
    },
    {
      q: 'Como altero minha senha?',
      a: 'Acesse Configurações → Senha dentro do painel. Se esqueceu sua senha, clique em "Esqueci minha senha" na tela de login e enviaremos um link de redefinição para seu e-mail.',
    },
    {
      q: 'Como atualizo os dados da minha empresa?',
      a: 'Acesse Configurações → Empresa no painel. Os dados atualizados aparecem automaticamente nos contratos e documentos gerados.',
    },
    {
      q: 'Posso usar a WMove em mais de um dispositivo?',
      a: 'Sim. A plataforma é 100% web e funciona em qualquer navegador moderno — computador, tablet ou celular. Não há necessidade de instalação.',
    },
  ],
  planos: [
    {
      q: 'O período de trial é realmente grátis?',
      a: 'Sim. Os 14 dias de trial são totalmente gratuitos, sem necessidade de cadastrar cartão de crédito. Você tem acesso a todas as funcionalidades do plano escolhido.',
    },
    {
      q: 'O que acontece quando o trial acaba?',
      a: 'Ao fim do período gratuito, você receberá um e-mail pedindo para escolher um plano. Se não contratar, o acesso será suspenso, mas seus dados são mantidos por 90 dias.',
    },
    {
      q: 'Posso mudar de plano a qualquer momento?',
      a: 'Upgrade pode ser feito a qualquer momento com cobrança proporcional. Downgrade é aplicado no próximo ciclo. Não é possível fazer downgrade para um plano com limite menor que a quantidade de veículos já cadastrados.',
    },
    {
      q: 'Como funciona a cobrança anual?',
      a: 'No plano anual, você paga 12 meses de uma só vez com 20% de desconto. Isso equivale a pagar 10 meses e ganhar 2 grátis. A cobrança é feita antecipadamente no início de cada ciclo anual.',
    },
    {
      q: 'Quais formas de pagamento são aceitas?',
      a: 'Aceitamos cartão de crédito (Visa, Mastercard, Elo, Amex) e PIX. Para planos anuais acima do WPlus, também aceitamos boleto bancário mediante solicitação pelo suporte.',
    },
    {
      q: 'Como cancelo minha assinatura?',
      a: 'Acesse Configurações → Plano → Cancelar assinatura. O cancelamento é efetivado no fim do ciclo atual, sem multa ou taxa. Seus dados ficam disponíveis para exportação por 30 dias após o cancelamento.',
    },
  ],
  frota: [
    {
      q: 'Como cadastro um veículo?',
      a: 'No menu Frota, clique em "Novo veículo" e preencha os dados: placa, marca, modelo, ano, combustível, quilometragem e diária padrão. A placa é validada automaticamente no formato brasileiro.',
    },
    {
      q: 'Como atualizo o status de um veículo?',
      a: 'Clique no veículo na lista da Frota para abrir o modal de edição. O status (disponível, alugado, manutenção ou inativo) pode ser alterado diretamente. Ao encerrar um aluguel, o status volta automaticamente para "disponível".',
    },
    {
      q: 'Posso cadastrar veículos acima do limite do meu plano?',
      a: 'Não. Ao atingir o limite do seu plano, o sistema bloqueia o cadastro de novos veículos. Você precisará fazer upgrade para continuar adicionando.',
    },
    {
      q: 'Como registro a manutenção de um veículo?',
      a: 'Acesse o módulo Oficina no menu lateral. Crie uma nova ordem de serviço com o veículo, tipo de manutenção (preventiva, corretiva ou revisão), data e custo. Ao concluir, marque como finalizada.',
    },
    {
      q: 'O sistema atualiza a quilometragem automaticamente?',
      a: 'A quilometragem é atualizada manualmente nas vistorias de devolução ou diretamente no cadastro do veículo. Integração automática com telemetria está no roadmap de futuras versões.',
    },
  ],
  alugueis: [
    {
      q: 'Como crio um novo aluguel?',
      a: 'No módulo Aluguéis, clique em "Novo aluguel". Selecione o cliente (ou cadastre um novo), o veículo disponível, as datas de início e devolução prevista, e o valor da diária. O contrato é gerado automaticamente.',
    },
    {
      q: 'O que é a diferença entre Agendamentos e Aluguéis?',
      a: 'Agendamentos são reservas futuras — o veículo ainda não saiu da garagem. Aluguéis são locações ativas ou encerradas. Você pode converter um agendamento em aluguel ativo com um clique.',
    },
    {
      q: 'O sistema detecta conflito de datas?',
      a: 'Sim. Ao criar um agendamento, o sistema verifica automaticamente se o veículo já tem reserva ou aluguel ativo no período selecionado e bloqueia o conflito.',
    },
    {
      q: 'Como emito o contrato de locação?',
      a: 'No módulo Contratos, clique no número do contrato e depois em "Baixar PDF" para gerar o documento ou "Imprimir" para abrir o modo de impressão do navegador. O contrato é gerado automaticamente com os dados do cliente, veículo e condições.',
    },
    {
      q: 'Como registro a devolução de um veículo?',
      a: 'No módulo Aluguéis, clique no aluguel ativo e selecione "Encerrar locação". Informe a data real de devolução e o valor final (se diferente do calculado). O veículo volta automaticamente para "disponível".',
    },
  ],
  financeiro: [
    {
      q: 'O módulo financeiro substitui minha contabilidade?',
      a: 'Não. O módulo financeiro é uma ferramenta de gestão interna para controle de receitas, despesas e fluxo de caixa da locadora. Para contabilidade fiscal, DRE e obrigações tributárias, utilize um contador.',
    },
    {
      q: 'Como registro despesas?',
      a: 'No módulo Financeiro, clique em "Nova despesa" e categorize o gasto (combustível, manutenção, seguro, multa, limpeza, impostos, etc.). As despesas são consolidadas automaticamente no DRE e no fluxo de caixa.',
    },
    {
      q: 'Como exporto os dados financeiros?',
      a: 'No módulo Relatórios, clique em "Excel" ou "PDF" no topo da página. O PDF gera um relatório formatado; o Excel exporta os dados em planilha editável com abas separadas por KPI, receita mensal e veículos.',
    },
    {
      q: 'Como funciona o controle de pagamentos dos aluguéis?',
      a: 'Ao encerrar um aluguel, um pagamento pendente é criado automaticamente. No módulo Pagamentos, você marca como recebido, registra o método (PIX, dinheiro, cartão, etc.) e a data do recebimento.',
    },
  ],
  seguranca: [
    {
      q: 'Meus dados estão seguros na WMove?',
      a: 'Sim. Todos os dados são criptografados em trânsito (TLS 1.2+) e em repouso (AES-256). O acesso ao banco de dados usa Row Level Security — cada empresa acessa apenas seus próprios dados. Nossa infraestrutura é hospedada na Supabase (AWS) com certificação SOC 2.',
    },
    {
      q: 'A WMove compartilha meus dados com terceiros?',
      a: 'Não vendemos nem comercializamos dados. Compartilhamos apenas com parceiros de infraestrutura estritamente necessários (banco de dados, e-mail, pagamentos), todos com contratos de proteção de dados. Veja nossa Política de Privacidade para detalhes completos.',
    },
    {
      q: 'Como solicito a exclusão dos meus dados?',
      a: 'Envie um e-mail para privacidade@wmove.com.br com sua solicitação. Respondemos em até 15 dias úteis. Ao cancelar a conta, os dados são excluídos automaticamente após 90 dias.',
    },
    {
      q: 'A WMove está em conformidade com a LGPD?',
      a: 'Sim. A WMove trata os dados conforme a Lei 13.709/2018 (LGPD), com bases legais adequadas para cada finalidade, DPO designado e processos de atendimento a direitos dos titulares. Consulte nossa Política de Privacidade em wmove.com.br/privacidade.',
    },
    {
      q: 'O que fazer se suspeitar de acesso não autorizado à minha conta?',
      a: 'Altere sua senha imediatamente em Configurações → Senha e envie um e-mail para seguranca@wmove.com.br descrevendo o ocorrido. Também recomendamos ativar a autenticação em dois fatores para maior segurança.',
    },
  ],
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="faq-chevron">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  )
}

export default function AjudaPage() {
  const { theme, toggleTheme } = useTheme()
  const [activeCat, setActiveCat] = useState('conta')
  const [search, setSearch] = useState('')

  const faqs = FAQS[activeCat] || []
  const filtered = search.trim()
    ? Object.values(FAQS).flat().filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : faqs

  return (
    <>
      <div className="orbs">
        <div className="orb amber" style={{ opacity: 0.12 }} />
        <div className="orb indigo" style={{ opacity: 0.07 }} />
      </div>
      <div className="noise" />

      <header className="termos-topbar">
        <Link to="/" className="termos-brand">
          <img src="/assets/wmove-logo.png" alt="WMove" className="termos-logo" />
          <span>WMove</span>
        </Link>
        <div className="termos-topbar-right">
          <Link to="/cadastro" className="termos-cta-btn">Criar conta grátis</Link>
          <button className="icon-btn" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark'
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            }
          </button>
        </div>
      </header>

      <div className="ajuda-page">
        {/* Hero */}
        <div className="ajuda-hero">
          <h1>Como podemos ajudar?</h1>
          <p>Encontre respostas para as perguntas mais comuns sobre a plataforma WMove.</p>
          <div className="ajuda-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar em todas as perguntas…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ajuda-search"
            />
            {search && (
              <button className="ajuda-search-clear" onClick={() => setSearch('')}>×</button>
            )}
          </div>
        </div>

        {/* Categories */}
        {!search && (
          <div className="ajuda-cats">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`ajuda-cat${activeCat === c.id ? ' active' : ''}`}
                onClick={() => setActiveCat(c.id)}
              >
                <span className="ajuda-cat-icon">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* FAQ list */}
        <div className="ajuda-faq">
          {search && (
            <div className="ajuda-search-result">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{search}"
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="ajuda-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
              <p>Nenhuma pergunta encontrada para "{search}".</p>
              <button onClick={() => setSearch('')}>Limpar busca</button>
            </div>
          ) : (
            filtered.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)
          )}
        </div>

        {/* Contact CTA */}
        <div className="ajuda-contact">
          <div className="ajuda-contact-card">
            <div className="ajuda-contact-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3>Não encontrou o que precisava?</h3>
              <p>Nossa equipe responde em até 1 dia útil.</p>
            </div>
            <a href="mailto:suporte@wmove.com.br" className="termos-cta-btn">
              Falar com suporte
            </a>
          </div>
        </div>

        <footer className="sobre-footer">
          <p>© 2026 WMove Tecnologia Ltda.</p>
          <div className="sobre-footer-links">
            <a href="/termos">Termos</a><span>·</span>
            <a href="/privacidade">Privacidade</a><span>·</span>
            <a href="mailto:suporte@wmove.com.br">Suporte</a>
          </div>
        </footer>
      </div>
    </>
  )
}
