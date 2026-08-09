import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import '../styles/termos.css'

const SECTIONS = [
  { id: 'intro',       label: 'Introdução'                    },
  { id: 'coletamos',   label: 'O que coletamos'               },
  { id: 'uso',         label: 'Como usamos os dados'          },
  { id: 'compartilha', label: 'Compartilhamento'              },
  { id: 'retencao',    label: 'Retenção e exclusão'           },
  { id: 'cookies',     label: 'Cookies e rastreamento'        },
  { id: 'lgpd',        label: 'LGPD — seus direitos'          },
  { id: 'menores',     label: 'Menores de idade'              },
  { id: 'seguranca',   label: 'Segurança'                     },
  { id: 'incidentes',  label: 'Incidentes de segurança'       },
  { id: 'transferencia','label': 'Transferência internacional'},
  { id: 'alteracoes',  label: 'Alterações nesta política'     },
  { id: 'contato',     label: 'Contato e DPO'                 },
]

export default function PrivacidadePage() {
  const { theme, toggleTheme } = useTheme()
  const [active, setActive] = useState('intro')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }) },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

      <div className="termos-page">
        <aside className="termos-sidebar">
          <div className="termos-sidebar-inner">
            <div className="termos-sidebar-title">Neste documento</div>
            <nav className="termos-nav">
              {SECTIONS.map(s => (
                <button key={s.id} className={`termos-nav-item${active === s.id ? ' active' : ''}`} onClick={() => scrollTo(s.id)}>
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="termos-meta">
              <div className="termos-meta-row"><span>Versão</span><span>1.0</span></div>
              <div className="termos-meta-row"><span>Vigência</span><span>03/06/2026</span></div>
              <div className="termos-meta-row"><span>DPO</span><span>dpo@wmove.com.br</span></div>
            </div>
          </div>
        </aside>

        <main className="termos-content">
          <div className="termos-hero">
            <div className="termos-hero-badge">Privacidade &amp; LGPD</div>
            <h1 className="termos-hero-title">Política de Privacidade, LGPD e Segurança</h1>
            <p className="termos-hero-sub">
              A WMove respeita sua privacidade e está comprometida com a proteção dos seus dados pessoais. Este documento descreve como coletamos, usamos, armazenamos e protegemos suas informações, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
            </p>
            <div className="termos-hero-chips">
              <span className="termos-chip">Vigência: 03/06/2026</span>
              <span className="termos-chip">LGPD</span>
              <span className="termos-chip">ISO 27001 referência</span>
            </div>
          </div>

          {/* 1 */}
          <section id="intro" className="termos-section">
            <h2>1. Introdução</h2>
            <p>A <strong>WMove Tecnologia Ltda.</strong> ("WMove", "nós" ou "nosso") leva a sério a privacidade e a segurança dos dados das pessoas que utilizam nossa plataforma. Esta Política de Privacidade ("Política") explica nossas práticas de coleta, uso, armazenamento, compartilhamento e proteção de dados pessoais.</p>
            <p>Esta Política se aplica a todos os usuários da plataforma WMove, visitantes do site <strong>wmove.com.br</strong> e quaisquer pessoas cujos dados sejam processados pela WMove no contexto da prestação de seus serviços.</p>
            <p>Ao utilizar nossa plataforma ou fornecer seus dados, você declara ter lido e compreendido esta Política. Caso não concorde, recomendamos não utilizar nossos serviços.</p>
            <div className="termos-callout info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p>A WMove atua como <strong>operadora</strong> de dados pessoais de terceiros inseridos na plataforma pelos clientes (locadoras). O cliente (locadora) é o <strong>controlador</strong> desses dados e responsável por sua coleta com as devidas bases legais.</p>
            </div>
          </section>

          {/* 2 */}
          <section id="coletamos" className="termos-section">
            <h2>2. O que coletamos</h2>
            <h3>2.1 Dados fornecidos diretamente por você</h3>
            <ul>
              <li><strong>Dados de cadastro:</strong> nome completo, e-mail, telefone, cargo;</li>
              <li><strong>Dados da empresa:</strong> razão social, CNPJ, endereço completo;</li>
              <li><strong>Dados de autenticação:</strong> endereço de e-mail e hash da senha (nunca armazenamos a senha em texto plano);</li>
              <li><strong>Dados de pagamento:</strong> histórico de transações, plano contratado (dados de cartão são processados diretamente pelo parceiro de pagamento — não os armazenamos).</li>
            </ul>
            <h3>2.2 Dados coletados automaticamente</h3>
            <ul>
              <li><strong>Dados de uso:</strong> páginas acessadas, funcionalidades utilizadas, tempo de sessão, frequência de uso;</li>
              <li><strong>Dados técnicos:</strong> endereço IP, tipo e versão do navegador, sistema operacional, resolução de tela;</li>
              <li><strong>Logs de acesso:</strong> data, hora e origem de cada acesso (exigido pelo Marco Civil da Internet — Lei 12.965/2014);</li>
              <li><strong>Cookies e tecnologias similares:</strong> conforme descrito na seção específica.</li>
            </ul>
            <h3>2.3 Dados de terceiros inseridos pelo cliente</h3>
            <p>Quando você utiliza a plataforma para gerir sua locadora, você pode inserir dados pessoais de seus clientes (nome, CPF, CNH, telefone, etc.) e funcionários. Você é o controlador desses dados; a WMove os processa apenas como operadora, sob suas instruções.</p>
          </section>

          {/* 3 */}
          <section id="uso" className="termos-section">
            <h2>3. Como usamos seus dados</h2>
            <div className="termos-def-grid">
              <div className="termos-def-item">
                <dt>Prestação do serviço</dt>
                <dd>Criar e gerenciar sua conta, processar transações, fornecer suporte técnico e garantir o funcionamento da plataforma.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Faturamento</dt>
                <dd>Processar cobranças, emitir notas fiscais e gerenciar assinaturas e cancelamentos.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Comunicação</dt>
                <dd>Enviar notificações transacionais, alertas de segurança, atualizações do produto e comunicados importantes.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Melhoria do produto</dt>
                <dd>Analisar padrões de uso anonimizados para identificar melhorias e novas funcionalidades.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Segurança</dt>
                <dd>Detectar e prevenir fraudes, abusos, acessos não autorizados e outros incidentes de segurança.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Obrigação legal</dt>
                <dd>Cumprir obrigações legais, responder a ordens judiciais e cooperar com autoridades competentes.</dd>
              </div>
            </div>
            <h3>3.1 Marketing</h3>
            <p>Podemos enviar comunicações sobre novidades, ofertas e conteúdos relevantes apenas com seu consentimento. Você pode cancelar o recebimento a qualquer momento clicando em "Descadastrar" no rodapé de qualquer e-mail ou enviando solicitação para <strong>privacidade@wmove.com.br</strong>.</p>
          </section>

          {/* 4 */}
          <section id="compartilha" className="termos-section">
            <h2>4. Compartilhamento de dados</h2>
            <p><strong>Não vendemos, alugamos ou comercializamos seus dados pessoais.</strong> Compartilhamos informações apenas nas seguintes situações:</p>
            <h3>4.1 Parceiros de infraestrutura e serviços</h3>
            <ul>
              <li><strong>Supabase (BaaS / banco de dados):</strong> armazenamento seguro dos dados na infraestrutura AWS (regiões Brasil/EUA);</li>
              <li><strong>Processadoras de pagamento:</strong> para gestão de cobranças e assinaturas, sob contratos de proteção de dados;</li>
              <li><strong>Serviços de e-mail transacional:</strong> para envio de notificações e confirmações;</li>
              <li><strong>Serviços de monitoramento:</strong> para rastreamento de erros e performance da aplicação.</li>
            </ul>
            <p>Todos os parceiros são contratualmente obrigados a proteger seus dados e utilizá-los apenas para as finalidades para as quais foram contratados.</p>
            <h3>4.2 Autoridades e cumprimento legal</h3>
            <p>Podemos divulgar dados quando exigido por lei, ordem judicial, ou para proteger direitos, segurança ou propriedade da WMove, de nossos clientes ou de terceiros.</p>
            <h3>4.3 Transferência de negócios</h3>
            <p>Em caso de fusão, aquisição, reorganização ou venda de ativos, seus dados podem ser transferidos ao sucessor, que ficará vinculado a esta Política.</p>
          </section>

          {/* 5 */}
          <section id="retencao" className="termos-section">
            <h2>5. Retenção e exclusão de dados</h2>
            <p>Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta Política, respeitando os seguintes critérios:</p>
            <ul>
              <li><strong>Conta ativa:</strong> dados mantidos enquanto houver assinatura ativa;</li>
              <li><strong>Após cancelamento:</strong> dados disponíveis para exportação por 30 dias, excluídos definitivamente após 90 dias do cancelamento;</li>
              <li><strong>Logs de acesso:</strong> mantidos por 6 meses, conforme obrigação do Marco Civil da Internet;</li>
              <li><strong>Dados fiscais e financeiros:</strong> mantidos por 5 anos, conforme obrigação tributária;</li>
              <li><strong>Backup:</strong> cópias de segurança são excluídas automaticamente após 30 dias.</li>
            </ul>
            <div className="termos-callout warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p>Após a exclusão definitiva, os dados não podem ser recuperados. Recomendamos exportar todos os seus dados antes de cancelar a assinatura.</p>
            </div>
          </section>

          {/* 6 */}
          <section id="cookies" className="termos-section">
            <h2>6. Cookies e rastreamento</h2>
            <p>Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma:</p>
            <h3>6.1 Tipos de cookies</h3>
            <ul>
              <li><strong>Essenciais:</strong> necessários para o funcionamento da plataforma (autenticação, preferências de sessão). Não podem ser desativados;</li>
              <li><strong>Analíticos:</strong> coletam informações anônimas sobre como a plataforma é utilizada, para fins de melhoria;</li>
              <li><strong>Funcionais:</strong> lembram suas preferências (tema, idioma, configurações de layout).</li>
            </ul>
            <h3>6.2 Controle de cookies</h3>
            <p>Você pode gerenciar cookies nas configurações do seu navegador. A desativação de cookies essenciais pode comprometer o funcionamento da plataforma. Não utilizamos cookies de rastreamento para publicidade.</p>
          </section>

          {/* 7 */}
          <section id="lgpd" className="termos-section">
            <h2>7. LGPD — Seus direitos como titular</h2>
            <p>A Lei Geral de Proteção de Dados (Lei 13.709/2018) garante a você os seguintes direitos em relação aos seus dados pessoais:</p>
            <div className="termos-def-grid">
              <div className="termos-def-item">
                <dt>Confirmação</dt>
                <dd>Confirmar se tratamos seus dados pessoais.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Acesso</dt>
                <dd>Obter uma cópia dos dados que tratamos sobre você.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Correção</dt>
                <dd>Corrigir dados incompletos, inexatos ou desatualizados.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Eliminação</dt>
                <dd>Solicitar a exclusão de dados desnecessários ou tratados sem base legal.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Portabilidade</dt>
                <dd>Receber seus dados em formato estruturado e interoperável.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Revogação</dt>
                <dd>Retirar consentimento a qualquer momento, sem prejuízo aos tratamentos anteriores.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Oposição</dt>
                <dd>Opor-se ao tratamento realizado com base em legítimo interesse.</dd>
              </div>
              <div className="termos-def-item">
                <dt>Informação</dt>
                <dd>Saber com quais entidades compartilhamos seus dados.</dd>
              </div>
            </div>
            <h3>7.1 Como exercer seus direitos</h3>
            <p>Envie sua solicitação para <strong>privacidade@wmove.com.br</strong> com:</p>
            <ul>
              <li>Identificação do direito que deseja exercer;</li>
              <li>Nome completo e e-mail cadastrado;</li>
              <li>Descrição clara do pedido.</li>
            </ul>
            <p>Responderemos em até <strong>15 dias úteis</strong>. Em casos complexos, esse prazo pode ser prorrogado por mais 15 dias, com comunicação prévia.</p>
            <h3>7.2 Reclamação à ANPD</h3>
            <p>Caso considere que seus direitos não foram atendidos, você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD) em <strong>gov.br/anpd</strong>.</p>
          </section>

          {/* 8 */}
          <section id="menores" className="termos-section">
            <h2>8. Menores de idade</h2>
            <p>A plataforma WMove é destinada exclusivamente a pessoas jurídicas e maiores de 18 anos, com capacidade civil plena. Não coletamos intencionalmente dados de menores de idade. Caso identifiquemos que dados de menores foram fornecidos inadvertidamente, procederemos à exclusão imediata.</p>
          </section>

          {/* 9 */}
          <section id="seguranca" className="termos-section">
            <h2>9. Segurança da informação</h2>
            <p>A WMove implementa medidas técnicas, administrativas e organizacionais robustas para proteger seus dados:</p>
            <h3>9.1 Medidas técnicas</h3>
            <ul>
              <li><strong>Criptografia em trânsito:</strong> TLS 1.2+ em todas as comunicações cliente-servidor;</li>
              <li><strong>Criptografia em repouso:</strong> AES-256 para dados armazenados;</li>
              <li><strong>Controle de acesso:</strong> Row Level Security (RLS) no banco de dados — cada cliente acessa apenas seus próprios dados;</li>
              <li><strong>Autenticação:</strong> hash de senha com bcrypt (fator de custo adequado), suporte a autenticação multifator (MFA);</li>
              <li><strong>Backups automáticos:</strong> cópias diárias com retenção de 30 dias, armazenadas em região separada;</li>
              <li><strong>Monitoramento contínuo:</strong> alertas em tempo real para tentativas de acesso suspeitas e anomalias;</li>
              <li><strong>Infraestrutura:</strong> hospedagem na Supabase (AWS), com certificações SOC 2 Type II e ISO 27001.</li>
            </ul>
            <h3>9.2 Medidas organizacionais</h3>
            <ul>
              <li>Acesso interno limitado ao mínimo necessário (princípio do menor privilégio);</li>
              <li>Colaboradores treinados em boas práticas de segurança e proteção de dados;</li>
              <li>Revisões periódicas de segurança e testes de penetração;</li>
              <li>Política interna de resposta a incidentes.</li>
            </ul>
            <div className="termos-callout info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <p>Encontrou uma vulnerabilidade? Reporte responsavelmente para <strong>seguranca@wmove.com.br</strong>. Levamos todos os reports a sério e respondemos em até 48 horas.</p>
            </div>
          </section>

          {/* 10 */}
          <section id="incidentes" className="termos-section">
            <h2>10. Incidentes de segurança</h2>
            <p>Em caso de incidente de segurança que possa resultar em risco ou dano relevante aos titulares de dados, a WMove:</p>
            <ul>
              <li>Comunicará a ANPD em prazo razoável (referência: 72 horas após a ciência do incidente), conforme exigido pela LGPD;</li>
              <li>Notificará os usuários afetados por e-mail com informações claras sobre o que ocorreu, quais dados foram afetados e quais medidas foram tomadas;</li>
              <li>Adotará imediatamente as medidas de contenção e remediação cabíveis;</li>
              <li>Documentará o incidente e as ações tomadas para fins de auditoria.</li>
            </ul>
          </section>

          {/* 11 */}
          <section id="transferencia" className="termos-section">
            <h2>11. Transferência internacional de dados</h2>
            <p>A WMove utiliza infraestrutura da Supabase, que opera em servidores da Amazon Web Services (AWS), podendo incluir regiões fora do Brasil (EUA). Essa transferência é realizada com as seguintes garantias:</p>
            <ul>
              <li>Contrato de processamento de dados (DPA) com cláusulas contratuais padrão;</li>
              <li>Parceiros certificados em SOC 2 Type II e ISO 27001;</li>
              <li>Adoção de salvaguardas adequadas conforme art. 33 da LGPD.</li>
            </ul>
          </section>

          {/* 12 */}
          <section id="alteracoes" className="termos-section">
            <h2>12. Alterações nesta política</h2>
            <p>Esta Política pode ser atualizada periodicamente para refletir mudanças em nossas práticas, na legislação ou nos serviços oferecidos. Em caso de alterações relevantes:</p>
            <ul>
              <li>Publicaremos a nova versão em <strong>wmove.com.br/privacidade</strong> com a data de vigência;</li>
              <li>Notificaremos os usuários por e-mail com pelo menos 15 dias de antecedência;</li>
              <li>Para mudanças que exijam novo consentimento, solicitaremos sua confirmação antes de continuar o tratamento.</li>
            </ul>
          </section>

          {/* 13 */}
          <section id="contato" className="termos-section">
            <h2>13. Contato e DPO</h2>
            <p>Para exercer seus direitos, tirar dúvidas sobre esta Política ou relatar qualquer problema relacionado à privacidade dos seus dados, entre em contato:</p>
            <div className="termos-contact-card">
              <h3>Canais de contato</h3>
              <div className="termos-contact-grid">
                <div>
                  <div className="termos-contact-label">Privacidade geral</div>
                  <a href="mailto:privacidade@wmove.com.br">privacidade@wmove.com.br</a>
                </div>
                <div>
                  <div className="termos-contact-label">Encarregado (DPO)</div>
                  <a href="mailto:dpo@wmove.com.br">dpo@wmove.com.br</a>
                </div>
                <div>
                  <div className="termos-contact-label">Segurança</div>
                  <a href="mailto:seguranca@wmove.com.br">seguranca@wmove.com.br</a>
                </div>
                <div>
                  <div className="termos-contact-label">Endereço</div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Brasília, DF — Brasil</span>
                </div>
              </div>
            </div>
          </section>

          <div className="termos-footer">
            <p>© 2026 WMove Tecnologia Ltda. · Todos os direitos reservados.</p>
            <p>Este documento foi atualizado em 03/06/2026. Consulte também nossos <a href="/termos" style={{ color: 'var(--amber)' }}>Termos de Uso</a>.</p>
          </div>
        </main>
      </div>
    </>
  )
}
