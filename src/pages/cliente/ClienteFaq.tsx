import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const FAQ_DATA: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Geral",
    items: [
      { q: "Como funciona o sistema?", a: "O sistema é uma plataforma completa de gestão comercial e marketing. Você pode gerenciar leads, criar conteúdos, automatizar atendimentos e acompanhar resultados em um só lugar." },
      { q: "Como altero meus dados de perfil?", a: "Acesse Configurações no menu lateral e clique na aba Perfil. Lá você pode editar nome, e-mail, telefone e foto." },
      { q: "O que são créditos de IA?", a: "Créditos de IA são consumidos ao usar funcionalidades de inteligência artificial como geração de conteúdo, scripts de vendas, análise de anúncios e agentes de atendimento." },
    ],
  },
  {
    category: "CRM",
    items: [
      { q: "Como adiciono um novo lead?", a: "Na página do CRM, clique no botão '+ Novo Lead' no topo. Preencha os dados do contato e selecione a etapa do funil." },
      { q: "Como movo um lead entre etapas?", a: "Você pode arrastar o card do lead entre as colunas do kanban, ou abrir o lead e alterar a etapa no campo correspondente." },
      { q: "Como importo leads via CSV?", a: "Na página do CRM, clique em 'Importar CSV'. Baixe o modelo, preencha e faça upload. O sistema reconhece automaticamente os campos." },
      { q: "Como vinculo um produto a um lead?", a: "Abra o lead desejado e acesse a aba 'Produtos'. Clique em 'Adicionar Produto', selecione o produto cadastrado e defina quantidade e preço." },
    ],
  },
  {
    category: "Chat / WhatsApp",
    items: [
      { q: "Como conecto meu WhatsApp?", a: "Acesse Integrações > WhatsApp e siga o assistente de configuração. Você precisará escanear o QR Code com o WhatsApp do número desejado." },
      { q: "Como funcionam os agentes de IA?", a: "Os agentes de IA respondem automaticamente mensagens recebidas no WhatsApp com base nas instruções e conhecimento que você configurar." },
      { q: "As mensagens são salvas?", a: "Sim, todo o histórico de conversas é salvo e pode ser consultado na página de Chat a qualquer momento." },
    ],
  },
  {
    category: "Créditos e Plano",
    items: [
      { q: "Como compro mais créditos?", a: "Acesse Plano & Créditos no menu lateral. Escolha o pacote desejado e finalize o pagamento via Pix ou cartão." },
      { q: "O que acontece quando meus créditos acabam?", a: "As funcionalidades de IA ficam temporariamente indisponíveis até que novos créditos sejam adquiridos. O restante do sistema continua funcionando normalmente." },
      { q: "Como faço upgrade do meu plano?", a: "Acesse Plano & Créditos e clique em 'Alterar Plano'. Selecione o novo plano e confirme. A cobrança será proporcional." },
    ],
  },
  {
    category: "Financeiro",
    items: [
      { q: "Onde vejo minhas faturas?", a: "Acesse Configurações > Financeiro para ver o histórico de pagamentos e faturas emitidas." },
      { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos Pix e boleto bancário para compra de créditos e pagamento de planos." },
    ],
  },
  {
    category: "Integrações",
    items: [
      { q: "Quais integrações estão disponíveis?", a: "Atualmente suportamos WhatsApp (Evolution API), Google Calendar, Meta Ads e Google Ads. Novas integrações são adicionadas regularmente." },
      { q: "Como conecto o Google Agenda?", a: "Acesse Integrações > Google Calendar e autorize a conexão com sua conta Google. Seus eventos serão sincronizados automaticamente." },
    ],
  },
];

export default function ClienteFaq() {
  const [search, setSearch] = useState("");
  const lower = search.toLowerCase();

  const filtered = FAQ_DATA.map((cat) => ({
    ...cat,
    items: cat.items.filter((i) => i.q.toLowerCase().includes(lower) || i.a.toLowerCase().includes(lower)),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perguntas Frequentes</h1>
        <p className="text-muted-foreground text-sm mt-1">Encontre respostas rápidas sobre o sistema</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar pergunta..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar pergunta" className="pl-9" />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhuma pergunta encontrada. Tente outro termo ou fale com o suporte.</p>
      )}

      {filtered.map((cat) => (
        <div key={cat.category} className="space-y-2">
          <Badge variant="secondary" className="text-xs">{cat.category}</Badge>
          <Accordion type="multiple" className="border rounded-lg">
            {cat.items.map((item, idx) => (
              <AccordionItem key={idx} value={`${cat.category}-${idx}`} className="px-4">
                <AccordionTrigger className="text-sm text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
