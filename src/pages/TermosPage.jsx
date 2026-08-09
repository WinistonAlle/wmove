import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/termos.css'

const SECTIONS = [
  { id: 'aceitacao',       label: 'Aceitação dos termos'          },
  { id: 'definicoes',      label: 'Definições'                    },
  { id: 'servico',         label: 'Descrição do serviço'          },
  { id: 'cadastro',        label: 'Cadastro e conta'              },
  { id: 'planos',          label: 'Planos e pagamento'            },
  { id: 'cancelamento',    label: 'Cancelamento e reembolso'      },
  { id: 'obrigacoes',      label: 'Obrigações do usuário'         },
  { id: 'propriedade',     label: 'Propriedade intelectual'       },
  { id: 'privacidade',     label: 'Privacidade e LGPD'            },
  { id: 'seguranca',       label: 'Segurança'                     },
  { id: 'responsabilidade',label: 'Limitação de responsabilidade' },
  { id: 'disponibilidade', label: 'Disponibilidade e SLA'         },
  { id: 'modificacoes',    label: 'Modificações'                  },
  { id: 'rescisao',        label: 'Rescisão'                      },
  { id: 'geral',           label: 'Disposições gerais'            },
  { id: 'foro',            label: 'Foro e legislação'             },
]

export default function TermosPage() {
  const { theme, toggleTheme } = useTheme()
  const [active, setActive] = useState('aceitacao')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <div className="orbs">
        <div className="orb amber" style={{ opacity: 0.15 }} />
        <div className="orb indigo" style={{ opacity: 0.08 }} />
      </div>
      <div className="noise" />

      {/* Topbar */}
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

      <div className="termos-page">

        {/* Sidebar */}
        <aside className="termos-sidebar">
          <div className="termos-sidebar-inner">
            <div className="termos-sidebar-title">Neste documento</div>
            <nav className="termos-nav">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={`termos-nav-item${active === s.id ? ' active' : ''}`}
                  onClick={() => scrollTo(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="termos-meta">
              <div className="termos-meta-row">
                <span>Versão</span><span>1.0</span>
              </div>
              <div className="termos-meta-row">
                <span>Vigência</span><span>03/06/2026</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="termos-content">

          <div className="termos-hero">
            <div className="termos-hero-badge">Documento legal</div>
            <h1 className="termos-hero-title">Termos de Uso</h1>
            <p className="termos-hero-sub">
              Leia com atenção antes de utilizar a plataforma WMove. Ao criar uma conta ou utilizar qualquer funcionalidade do serviço, você declara ter lido, compreendido e concordado integralmente com estes Termos.
            </p>
            <div className="termos-hero-chips">
              <span className="termos-chip">Vigência: 03/06/2026</span>
              <span className="termos-chip">Versão 1.0</span>
              <span className="termos-chip">Legislação brasileira</span>
            </div>
          </div>

          {/* 1 */}
          <section id="aceitacao" className="termos-section">
            <h2>1. Aceitação dos Termos</h2>
            <p>Estes Termos de Uso ("Termos") constituem um contrato juridicamente vinculante entre você ("Usuário", "Cliente" ou "Empresa") e <strong>WMove Tecnologia Ltda.</strong> ("WMove", "nós" ou "nosso"), empresa brasileira dedicada ao desenvolvimento e operação de software de gestão para locadoras de veículos.</p>
            <p>Ao acessar, criar uma conta, assinar um plano ou utilizar qualquer funcionalidade da plataforma WMove, você confirma que:</p>
            <ul>
              <li>Leu e compreendeu integralmente estes Termos;</li>
              <li>Tem capacidade civil plena (ou está devidamente representado), nos termos do Código Civil Brasileiro;</li>
              <li>Age em nome da empresa ou pessoa jurídica que representa, tendo poderes para assumir obrigações contratuais;</li>
              <li>Concorda com o tratamento de dados pessoais conforme nossa Política de Privacidade.</li>
            </ul>
            <p>Caso não concorde com qualquer disposição destes Termos, não utilize a plataforma. A recusa implica a impossibilidade de acesso ao serviço.</p>
            <div className="termos-callout warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p>O uso continuado da plataforma após a publicação de novos Termos constitui aceitação automática das alterações. Recomendamos revisar este documento periodicamente.</p>
            </div>
          </section>

          {/* 2 */}
          <section id="definicoes" className="termos-section">
            <h2>2. Definições</h2>
            <p>Para fins destes Termos, aplicam-se as seguintes definições:</p>
            <div className="termos-def-grid">
              <div className="termos-def-item">
                <dt>Plataforma</dt>
                <dd>Sistema de software WMove, incluindo aplicação web, APIs, banco de dados, integrações e toda infraestrutura associada.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Usuário</dt>
                <dd>Pessoa física ou jurídica que acessa a Plataforma mediante cadastro.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Conta</dt>
                <dd>Perfil individual criado pelo Usuário para acessar a Plataforma, vinculado a uma Empresa.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Empresa</dt>
                <dd>Locadora de veículos cadastrada na Plataforma, que pode ter múltiplos usuários vinculados.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Dados</dt>
                <dd>Qualquer informação inserida, processada ou armazenada na Plataforma pelo Usuário, incluindo dados de clientes, veículos, contratos e movimentações financeiras.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Plano</dt>
                <dd>Modalidade de assinatura contratada pelo Usuário, com características e preços definidos na tabela vigente.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Trial</dt>
                <dd>Período de 14 dias de uso gratuito da Plataforma, sem necessidade de cartão de crédito, concedido no ato do cadastro.</dd>
              </div>
              <div className="termos-def-item">
                <dt>SLA</dt>
                <dd>Service Level Agreement — compromisso de disponibilidade e tempo de resposta do serviço.</dd>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section id="servico" className="termos-section">
            <h2>3. Descrição do Serviço</h2>
            <p>A WMove oferece uma plataforma SaaS (Software as a Service) para gestão operacional e financeira de locadoras de veículos, compreendendo, entre outras funcionalidades:</p>
            <ul>
              <li>Controle de frota (cadastro, status, documentação e quilometragem);</li>
              <li>Gestão de aluguéis, contratos e clientes;</li>
              <li>Agendamentos e reservas;</li>
              <li>Módulos de vistoria, oficina e manutenção;</li>
              <li>Controle financeiro (DRE, fluxo de caixa, despesas);</li>
              <li>Emissão de contratos e documentos;</li>
              <li>Relatórios e indicadores de desempenho;</li>
              <li>Notificações e alertas automatizados.</li>
            </ul>
            <p>O serviço é prestado exclusivamente via internet ("nuvem"), não havendo entrega de software para instalação local. A WMove reserva-se o direito de adicionar, modificar ou descontinuar funcionalidades a qualquer tempo, comunicando o Usuário com antecedência mínima de 30 dias para mudanças materiais.</p>
            <div className="termos-callout info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p>A WMove não é uma instituição financeira e não processa pagamentos de terceiros. O controle financeiro dentro da plataforma é exclusivamente para fins de gestão interna da locadora.</p>
            </div>
          </section>

          {/* 4 */}
          <section id="cadastro" className="termos-section">
            <h2>4. Cadastro e Conta de Usuário</h2>
            <h3>4.1 Requisitos</h3>
            <p>Para criar uma conta, o Usuário deve fornecer informações verdadeiras, completas e atualizadas, incluindo nome completo, e-mail válido, dados da empresa (CNPJ, endereço) e senha. O cadastro com dados falsos ou pertencentes a terceiros é expressamente proibido e pode resultar no cancelamento imediato da conta.</p>
            <h3>4.2 Responsabilidade pelo acesso</h3>
            <p>O Usuário é o único responsável por:</p>
            <ul>
              <li>Manter a confidencialidade de suas credenciais de acesso;</li>
              <li>Todas as atividades realizadas sob sua conta;</li>
              <li>Comunicar imediatamente a WMove sobre qualquer uso não autorizado de sua conta, pelo e-mail <strong>seguranca@wmove.com.br</strong>;</li>
              <li>Garantir que seus funcionários e colaboradores com acesso à plataforma cumpram estes Termos.</li>
            </ul>
            <p>A WMove não será responsável por prejuízos decorrentes do uso não autorizado da conta do Usuário que não tenham sido comunicados em tempo hábil.</p>
            <h3>4.3 Cadastro de colaboradores</h3>
            <p>O titular da conta pode convidar colaboradores para acessar a plataforma em nome da Empresa, conforme os limites e permissões do Plano contratado. O titular responde, perante a WMove, por todos os atos praticados pelos colaboradores cadastrados.</p>
            <h3>4.4 Unicidade da conta</h3>
            <p>Cada CNPJ pode ser vinculado a apenas uma conta ativa na plataforma. A criação de múltiplas contas para contornar restrições de plano é vedada e sujeita ao cancelamento de todas as contas envolvidas.</p>
          </section>

          {/* 5 */}
          <section id="planos" className="termos-section">
            <h2>5. Planos, Preços e Pagamento</h2>
            <h3>5.1 Período de Trial</h3>
            <p>Novos cadastros têm direito a 14 (quatorze) dias de acesso gratuito à plataforma, sem necessidade de inserção de dados de pagamento. Findo o período de trial sem a contratação de um plano pago, o acesso será automaticamente suspenso até a regularização.</p>
            <h3>5.2 Planos disponíveis</h3>
            <p>Os planos atualmente disponíveis, com respectivos limites e preços, estão descritos na página de preços em <strong>wmove.com.br/#pricing</strong>. A WMove reserva-se o direito de alterar planos e preços, com aviso prévio de 30 (trinta) dias por e-mail ao Usuário.</p>
            <h3>5.3 Cobrança</h3>
            <p>A assinatura é cobrada mensalmente (ou anualmente, se o Usuário optar pelo desconto anual), por antecipação, a partir da data de contratação. O pagamento é processado por parceiro certificado (processadora de pagamentos), e a WMove não armazena dados de cartão de crédito.</p>
            <h3>5.4 Inadimplência</h3>
            <p>Em caso de falha no pagamento:</p>
            <ul>
              <li><strong>1 a 7 dias em atraso:</strong> notificação por e-mail e acesso mantido;</li>
              <li><strong>8 a 15 dias:</strong> suspensão parcial — acesso somente leitura, sem criação de novos registros;</li>
              <li><strong>16 dias ou mais:</strong> suspensão total do acesso. Os dados são mantidos por 90 dias a partir da suspensão;</li>
              <li><strong>Após 90 dias:</strong> exclusão permanente dos dados.</li>
            </ul>
            <p>A reativação da conta após suspensão está sujeita ao pagamento de todas as faturas em aberto, incluindo eventual encargo de mora de 2% a.m. mais correção pelo IPCA.</p>
            <h3>5.5 Upgrade e downgrade</h3>
            <p>O Usuário pode fazer upgrade de plano a qualquer momento, com cobrança proporcional ao período restante do ciclo atual. O downgrade é aplicado no próximo ciclo de cobrança. Não é possível fazer downgrade para um plano cujo limite de veículos seja inferior à quantidade atualmente cadastrada.</p>
          </section>

          {/* 6 */}
          <section id="cancelamento" className="termos-section">
            <h2>6. Cancelamento e Política de Reembolso</h2>
            <h3>6.1 Cancelamento pelo Usuário</h3>
            <p>O Usuário pode cancelar sua assinatura a qualquer momento, diretamente pelo painel em <strong>Configurações → Plano</strong> ou por e-mail para <strong>suporte@wmove.com.br</strong>. O cancelamento é efetivado ao final do ciclo de cobrança vigente, sem cobrança adicional.</p>
            <h3>6.2 Direito de arrependimento</h3>
            <p>Nos termos do art. 49 do Código de Defesa do Consumidor (Lei 8.078/1990), o Usuário que contratar o serviço pela internet tem direito ao arrependimento e ao reembolso integral dentro de 7 (sete) dias corridos da primeira cobrança, desde que não tenha feito uso substancial da plataforma durante esse período (importação em massa de dados, emissão de contratos, etc.).</p>
            <h3>6.3 Reembolsos fora do prazo de arrependimento</h3>
            <p>Fora do prazo de arrependimento legal, não há reembolso proporcional por cancelamento antecipado de planos mensais. Para planos anuais, fica garantido o reembolso proporcional dos meses não utilizados, deduzida a diferença entre o preço mensal e o preço anual (desconto de 20%), caso o cancelamento ocorra após os primeiros 30 dias.</p>
            <h3>6.4 Exportação de dados</h3>
            <p>Ao solicitar o cancelamento, o Usuário pode exportar todos os seus dados em formato padrão (CSV/Excel) por até 30 dias após a efetivação do cancelamento. Após esse prazo, os dados serão excluídos definitivamente e não poderão ser recuperados.</p>
            <h3>6.5 Cancelamento pela WMove</h3>
            <p>A WMove pode cancelar a conta do Usuário, a seu exclusivo critério, nas seguintes hipóteses:</p>
            <ul>
              <li>Violação destes Termos;</li>
              <li>Inadimplência superior a 30 dias;</li>
              <li>Uso abusivo ou fraudulento da plataforma;</li>
              <li>Encerramento das operações da WMove, com aviso prévio mínimo de 60 dias.</li>
            </ul>
          </section>

          {/* 7 */}
          <section id="obrigacoes" className="termos-section">
            <h2>7. Obrigações e Responsabilidades do Usuário</h2>
            <h3>7.1 Uso lícito</h3>
            <p>O Usuário se compromete a utilizar a plataforma exclusivamente para fins lícitos e em conformidade com a legislação brasileira aplicável, incluindo a LGPD, o CDC, o Marco Civil da Internet (Lei 12.965/2014) e as normas do setor de locação de veículos.</p>
            <h3>7.2 É expressamente proibido:</h3>
            <ul>
              <li>Inserir dados de clientes e terceiros sem o devido consentimento e base legal (conforme LGPD);</li>
              <li>Utilizar a plataforma para armazenar, processar ou transmitir conteúdo ilegal, ofensivo ou que viole direitos de terceiros;</li>
              <li>Realizar engenharia reversa, descompilar, desmontar ou tentar extrair o código-fonte da plataforma;</li>
              <li>Acessar ou tentar acessar partes da plataforma sem autorização expressa;</li>
              <li>Sobrecarregar intencionalmente a infraestrutura (ataques DDoS, scraping agressivo, etc.);</li>
              <li>Revender, sublicenciar ou ceder o acesso à plataforma a terceiros sem autorização escrita da WMove;</li>
              <li>Utilizar bots, scripts automatizados ou crawlers para extração de dados;</li>
              <li>Remover ou ocultar avisos de copyright ou marcas da WMove;</li>
              <li>Usar a plataforma para fins concorrentes — incluindo benchmarking para desenvolvimento de produto similar.</li>
            </ul>
            <h3>7.3 Veracidade dos dados</h3>
            <p>O Usuário é inteiramente responsável pela veracidade, licitude e qualidade dos dados inseridos na plataforma. A WMove não verifica a autenticidade das informações cadastradas e não se responsabiliza por danos causados por dados incorretos ou fraudulentos.</p>
            <h3>7.4 Conformidade com a LGPD</h3>
            <p>O Usuário, ao inserir dados pessoais de terceiros (clientes, funcionários, etc.) na plataforma, atua como <strong>controlador</strong> desses dados, nos termos da Lei 13.709/2018 (LGPD). A WMove atua como <strong>operadora</strong>. O Usuário é responsável por: obter as bases legais adequadas para o tratamento; responder a solicitações de titulares; e garantir que o tratamento realizado está em conformidade com a LGPD.</p>
          </section>

          {/* 8 */}
          <section id="propriedade" className="termos-section">
            <h2>8. Propriedade Intelectual</h2>
            <h3>8.1 Titularidade da WMove</h3>
            <p>A plataforma WMove, incluindo todo o código-fonte, design, interface, algoritmos, marcas, logotipos, nomes comerciais e documentação, é de titularidade exclusiva da WMove Tecnologia Ltda. e está protegida pela legislação brasileira de propriedade intelectual (Lei 9.609/1998, Lei 9.610/1998) e por tratados internacionais.</p>
            <h3>8.2 Licença de uso</h3>
            <p>A WMove concede ao Usuário uma licença não exclusiva, intransferível, revogável e limitada para utilizar a plataforma exclusivamente para os fins previstos nestes Termos, enquanto houver assinatura ativa. Esta licença não transfere qualquer direito de propriedade intelectual ao Usuário.</p>
            <h3>8.3 Dados do Usuário</h3>
            <p>Os dados inseridos pelo Usuário na plataforma permanecem de sua propriedade. A WMove não reivindica propriedade sobre os dados de clientes, veículos, contratos ou qualquer informação inserida pelo Usuário. A WMove pode utilizar dados anonimizados e agregados para melhoria do serviço e fins analíticos.</p>
            <h3>8.4 Feedback</h3>
            <p>Sugestões, feedbacks e ideias enviadas pelo Usuário à WMove podem ser utilizados para melhoria do produto, sem que o Usuário faça jus a qualquer compensação ou direito de propriedade sobre tais melhorias.</p>
          </section>

          {/* 9 */}
          <section id="privacidade" className="termos-section">
            <h2>9. Privacidade e Proteção de Dados (LGPD)</h2>
            <h3>9.1 Dados coletados</h3>
            <p>A WMove coleta e trata os seguintes dados do Usuário:</p>
            <ul>
              <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, CNPJ, endereço da empresa;</li>
              <li><strong>Dados de uso:</strong> logs de acesso, funcionalidades utilizadas, frequência de uso;</li>
              <li><strong>Dados de pagamento:</strong> histórico de transações (não armazenamos dados de cartão);</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional.</li>
            </ul>
            <h3>9.2 Finalidades do tratamento</h3>
            <p>Os dados são tratados para: prestação do serviço contratado; cobrança e faturamento; comunicações sobre o serviço; suporte técnico; prevenção a fraudes; cumprimento de obrigações legais; e melhoria contínua da plataforma.</p>
            <h3>9.3 Bases legais</h3>
            <p>O tratamento ocorre com base nas seguintes hipóteses da LGPD: execução do contrato (art. 7º, V), cumprimento de obrigação legal (art. 7º, II), legítimo interesse (art. 7º, IX) e, quando aplicável, consentimento (art. 7º, I).</p>
            <h3>9.4 Compartilhamento</h3>
            <p>Os dados podem ser compartilhados com: parceiros de infraestrutura (Supabase, AWS), processadoras de pagamento, serviços de e-mail transacional e autoridades públicas quando exigido por lei. Não vendemos dados pessoais a terceiros.</p>
            <h3>9.5 Retenção</h3>
            <p>Os dados são retidos pelo prazo necessário ao cumprimento das finalidades, e por até 5 (cinco) anos após o encerramento da conta para fins de obrigação legal (guarda de registros — Marco Civil da Internet) e defesa em processos judiciais.</p>
            <h3>9.6 Direitos dos titulares</h3>
            <p>Nos termos da LGPD, o Usuário tem direito a: confirmar o tratamento; acessar seus dados; corrigir dados incompletos ou inexatos; anonimizar, bloquear ou eliminar dados desnecessários; solicitar a portabilidade; revogar o consentimento. Solicitações devem ser enviadas para <strong>privacidade@wmove.com.br</strong>. O prazo de resposta é de até 15 dias úteis.</p>
            <h3>9.7 Encarregado (DPO)</h3>
            <p>O Encarregado de Proteção de Dados pode ser contatado pelo e-mail <strong>dpo@wmove.com.br</strong>.</p>
            <div className="termos-callout info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p>Para detalhes completos sobre o tratamento de dados pessoais, consulte nossa <strong>Política de Privacidade</strong> em wmove.com.br/privacidade.</p>
            </div>
          </section>

          {/* 10 */}
          <section id="seguranca" className="termos-section">
            <h2>10. Segurança</h2>
            <p>A WMove adota medidas técnicas e organizacionais adequadas para proteger os dados contra acesso não autorizado, perda acidental, destruição ou alteração, incluindo:</p>
            <ul>
              <li>Criptografia em trânsito (TLS 1.2+) e em repouso (AES-256);</li>
              <li>Controle de acesso baseado em papéis (RLS — Row Level Security);</li>
              <li>Backups automáticos diários com retenção de 30 dias;</li>
              <li>Monitoramento contínuo de segurança e detecção de anomalias;</li>
              <li>Autenticação multifator disponível para todas as contas.</li>
            </ul>
            <p>Em caso de incidente de segurança que afete dados pessoais, a WMove notificará a ANPD e os Usuários afetados dentro de 72 horas, conforme exigido pela LGPD.</p>
            <p>O Usuário reconhece que nenhum sistema é 100% seguro e que a WMove não garante a segurança absoluta dos dados contra ameaças externas imprevisíveis. O Usuário deve adotar práticas de segurança adequadas em seu próprio ambiente, como uso de senhas fortes e restrição de acesso a colaboradores confiáveis.</p>
          </section>

          {/* 11 */}
          <section id="responsabilidade" className="termos-section">
            <h2>11. Limitação de Responsabilidade</h2>
            <h3>11.1 Exclusões</h3>
            <p>Na máxima extensão permitida pela legislação brasileira, a WMove não se responsabiliza por:</p>
            <ul>
              <li>Danos indiretos, incidentais, especiais, punitivos ou consequentes (lucros cessantes, perda de dados, danos à reputação), ainda que informada da possibilidade de tais danos;</li>
              <li>Danos causados por falha do Usuário em cumprir estes Termos;</li>
              <li>Danos decorrentes de uso indevido, negligente ou não autorizado da plataforma;</li>
              <li>Imprecisões ou erros nos dados inseridos pelo Usuário;</li>
              <li>Falhas em serviços de terceiros (internet, processadoras de pagamento, APIs de consulta);</li>
              <li>Consequências de decisões de negócio tomadas com base em relatórios ou dados extraídos da plataforma;</li>
              <li>Caso fortuito ou força maior (art. 393, Código Civil).</li>
            </ul>
            <h3>11.2 Teto de responsabilidade</h3>
            <p>A responsabilidade total da WMove perante o Usuário, em qualquer hipótese, fica limitada ao valor pago pelo Usuário nos 3 (três) meses anteriores ao evento que deu origem ao dano, ou ao valor mínimo de R$ 500,00 (quinhentos reais), o que for maior.</p>
            <h3>11.3 Atividades de alto risco</h3>
            <p>A plataforma não é indicada para situações onde a falha do software possa resultar em danos pessoais, morte ou perda patrimonial irreversível. A responsabilidade operacional pelas locações e contratos firmados pela locadora é exclusivamente do Usuário.</p>
            <div className="termos-callout warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <p>A WMove é uma ferramenta de gestão. Contratos de locação, apólices de seguro, cobranças de clientes e demais obrigações legais da locadora são de responsabilidade exclusiva do Usuário e devem observar a legislação aplicável ao setor.</p>
            </div>
          </section>

          {/* 12 */}
          <section id="disponibilidade" className="termos-section">
            <h2>12. Disponibilidade e SLA</h2>
            <h3>12.1 Compromisso de disponibilidade</h3>
            <p>A WMove se compromete a manter a plataforma disponível por no mínimo <strong>99,5% do tempo</strong> em cada mês civil (equivalente a até ~3,6h de indisponibilidade/mês), excluídas:</p>
            <ul>
              <li>Janelas de manutenção programada (comunicadas com 48h de antecedência);</li>
              <li>Indisponibilidade causada por falhas de terceiros (provedores de infraestrutura, CDN, etc.);</li>
              <li>Indisponibilidade causada por ação ou omissão do Usuário;</li>
              <li>Caso fortuito ou força maior.</li>
            </ul>
            <h3>12.2 Créditos por indisponibilidade</h3>
            <p>Caso a disponibilidade mensal fique abaixo do SLA, o Usuário poderá solicitar créditos proporcionais ao período de indisponibilidade, limitados a 15% do valor da mensalidade, mediante solicitação em até 15 dias após o ocorrido para <strong>sla@wmove.com.br</strong>.</p>
            <h3>12.3 Manutenções programadas</h3>
            <p>Manutenções programadas serão realizadas preferencialmente em horários de baixo uso (domingos entre 00h e 06h, horário de Brasília) e comunicadas por e-mail e banner na plataforma com antecedência mínima de 48 horas.</p>
            <h3>12.4 Backups</h3>
            <p>A WMove realiza backups automáticos diários com retenção de 30 dias. Restaurações específicas de dados podem ser solicitadas mediante análise de viabilidade técnica, sem garantia de sucesso, e podem estar sujeitas a cobrança adicional.</p>
          </section>

          {/* 13 */}
          <section id="modificacoes" className="termos-section">
            <h2>13. Modificações nos Termos e no Serviço</h2>
            <p>A WMove pode revisar estes Termos a qualquer momento, publicando a versão atualizada no endereço <strong>wmove.com.br/termos</strong> e notificando os Usuários por e-mail com antecedência mínima de:</p>
            <ul>
              <li><strong>30 dias</strong> para mudanças materiais que afetem direitos ou obrigações das partes;</li>
              <li><strong>7 dias</strong> para correções, ajustes de redação ou mudanças exigidas por lei;</li>
              <li><strong>Imediatamente</strong> em casos de emergência de segurança.</li>
            </ul>
            <p>O Usuário que discordar das modificações pode cancelar sua conta no prazo de aviso prévio, sendo-lhe garantido o reembolso proporcional do período não utilizado. A continuidade do uso após a vigência dos novos Termos constitui aceitação integral.</p>
          </section>

          {/* 14 */}
          <section id="rescisao" className="termos-section">
            <h2>14. Rescisão</h2>
            <h3>14.1 Pelo Usuário</h3>
            <p>O Usuário pode rescindir este contrato a qualquer tempo, cancelando sua assinatura conforme descrito na cláusula 6. A rescisão não gera ônus adicionais além do pagamento do período em curso.</p>
            <h3>14.2 Pela WMove — por justa causa</h3>
            <p>A WMove pode rescindir imediatamente, sem aviso prévio, em casos de:</p>
            <ul>
              <li>Violação grave destes Termos (uso ilícito, fraude, ataques à infraestrutura);</li>
              <li>Abertura de processo de falência, recuperação judicial ou liquidação pelo Usuário;</li>
              <li>Uso da plataforma para atividades ilegais.</li>
            </ul>
            <h3>14.3 Pela WMove — sem justa causa</h3>
            <p>A WMove pode encerrar o serviço sem justa causa mediante aviso prévio de 60 (sessenta) dias, com reembolso proporcional dos valores pagos antecipadamente.</p>
            <h3>14.4 Efeitos da rescisão</h3>
            <p>Após a rescisão: o acesso à plataforma é bloqueado imediatamente (justa causa) ou ao final do período pago (sem justa causa); os dados ficam disponíveis para exportação por 30 dias; após esse prazo, são excluídos definitivamente.</p>
          </section>

          {/* 15 */}
          <section id="geral" className="termos-section">
            <h2>15. Disposições Gerais</h2>
            <h3>15.1 Totalidade do acordo</h3>
            <p>Estes Termos, juntamente com a Política de Privacidade e eventuais Termos Adicionais para funcionalidades específicas, constituem o acordo integral entre as partes e substituem quaisquer entendimentos anteriores, verbais ou escritos.</p>
            <h3>15.2 Independência das cláusulas</h3>
            <p>Se qualquer cláusula destes Termos for considerada inválida ou inexequível por autoridade competente, as demais cláusulas permanecerão em pleno vigor.</p>
            <h3>15.3 Cessão</h3>
            <p>O Usuário não pode ceder seus direitos ou obrigações decorrentes destes Termos sem o consentimento prévio e por escrito da WMove. A WMove pode ceder estes Termos em caso de fusão, aquisição ou venda de ativos, notificando o Usuário com 30 dias de antecedência.</p>
            <h3>15.4 Renúncia</h3>
            <p>A omissão de qualquer das partes no exercício de seus direitos não constitui renúncia a esses direitos.</p>
            <h3>15.5 Comunicações</h3>
            <p>Comunicações oficiais da WMove serão feitas pelo e-mail cadastrado pelo Usuário. O Usuário deve manter seu e-mail atualizado. Comunicações do Usuário à WMove devem ser enviadas para <strong>juridico@wmove.com.br</strong> (assuntos legais) ou <strong>suporte@wmove.com.br</strong> (suporte técnico).</p>
          </section>

          {/* 16 */}
          <section id="foro" className="termos-section">
            <h2>16. Foro e Legislação Aplicável</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Para a resolução de controvérsias, as partes elegem o foro da <strong>Comarca de Belo Horizonte, Estado de Minas Gerais</strong>, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
            <p>Antes de qualquer medida judicial, as partes se comprometem a tentar resolver a controvérsia amigavelmente no prazo de 30 dias, mediante comunicação formal.</p>
            <p>Para questões envolvendo relações de consumo, aplicam-se subsidiariamente as disposições do Código de Defesa do Consumidor (Lei 8.078/1990).</p>

            <div className="termos-contact-card">
              <h3>Fale conosco</h3>
              <div className="termos-contact-grid">
                <div>
                  <div className="termos-contact-label">Suporte</div>
                  <a href="mailto:suporte@wmove.com.br">suporte@wmove.com.br</a>
                </div>
                <div>
                  <div className="termos-contact-label">Assuntos jurídicos</div>
                  <a href="mailto:juridico@wmove.com.br">juridico@wmove.com.br</a>
                </div>
                <div>
                  <div className="termos-contact-label">Privacidade / DPO</div>
                  <a href="mailto:dpo@wmove.com.br">dpo@wmove.com.br</a>
                </div>
                <div>
                  <div className="termos-contact-label">Segurança</div>
                  <a href="mailto:seguranca@wmove.com.br">seguranca@wmove.com.br</a>
                </div>
              </div>
            </div>
          </section>

          <div className="termos-footer">
            <p>© 2026 WMove Tecnologia Ltda. · CNPJ em processo de registro · Todos os direitos reservados.</p>
            <p>Este documento foi atualizado em 03/06/2026 e substitui todas as versões anteriores.</p>
          </div>

        </main>
      </div>
    </>
  )
}
