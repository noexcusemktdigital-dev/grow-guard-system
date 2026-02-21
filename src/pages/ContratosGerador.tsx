import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import {
  ContratoTipo, ContratoDono, ContratoRecorrencia,
  mockTemplates, FRANQUEADOS_LIST,
} from "@/data/contratosData";

const STEPS = ["Tipo", "Dono / Origem", "Dados do Cliente", "Contratação", "Revisão"];

export default function ContratosGerador() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  // Step 1
  const [tipo, setTipo] = useState<ContratoTipo>("Assessoria");
  const [templateId, setTemplateId] = useState("");

  // Step 2
  const [dono, setDono] = useState<ContratoDono>("Interno");
  const [franqueadoId, setFranqueadoId] = useState("");

  // Step 3
  const [clienteNome, setClienteNome] = useState("");
  const [clienteDoc, setClienteDoc] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteTel, setClienteTel] = useState("");
  const [clienteEndereco, setClienteEndereco] = useState("");
  const [clienteRg, setClienteRg] = useState("");

  // Step 4
  const [recorrencia, setRecorrencia] = useState<ContratoRecorrencia>("Mensal");
  const [valorMensal, setValorMensal] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [proposta, setProposta] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [duracaoMeses, setDuracaoMeses] = useState(0);
  const [qtdParcelas, setQtdParcelas] = useState(0);
  const [valorParcela, setValorParcela] = useState(0);
  const [servicosDescricao, setServicosDescricao] = useState("");
  const [cidade, setCidade] = useState("");

  const templatesFiltered = mockTemplates.filter(t => t.tipo === tipo && t.aprovado);
  const selectedTemplate = mockTemplates.find(t => t.id === templateId);
  const franqueado = FRANQUEADOS_LIST.find(f => f.id === franqueadoId);

  function getPreview() {
    if (!selectedTemplate) return "Nenhum template selecionado";
    return selectedTemplate.conteudo
      .replace(/\{\{cliente_nome\}\}/g, clienteNome || "—")
      .replace(/\{\{cliente_documento\}\}/g, clienteDoc || "—")
      .replace(/\{\{cliente_email\}\}/g, clienteEmail || "—")
      .replace(/\{\{cliente_endereco\}\}/g, clienteEndereco || "—")
      .replace(/\{\{cliente_telefone\}\}/g, clienteTel || "—")
      .replace(/\{\{cliente_rg\}\}/g, clienteRg || "—")
      .replace(/\{\{produto\}\}/g, tipo)
      .replace(/\{\{valor_mensal\}\}/g, valorMensal.toLocaleString("pt-BR"))
      .replace(/\{\{valor_total\}\}/g, valorTotal.toLocaleString("pt-BR"))
      .replace(/\{\{valor_parcela\}\}/g, valorParcela.toLocaleString("pt-BR"))
      .replace(/\{\{qtd_parcelas\}\}/g, qtdParcelas ? String(qtdParcelas) : "—")
      .replace(/\{\{duracao_meses\}\}/g, duracaoMeses ? String(duracaoMeses) : "—")
      .replace(/\{\{recorrencia\}\}/g, recorrencia)
      .replace(/\{\{data_inicio\}\}/g, dataInicio || "—")
      .replace(/\{\{data_fim\}\}/g, dataFim || "—")
      .replace(/\{\{data_cidade\}\}/g, cidade ? `${cidade}, ${new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}` : "—")
      .replace(/\{\{servicos_descricao\}\}/g, servicosDescricao || "—")
      .replace(/\{\{franqueado_nome\}\}/g, franqueado?.nome || "—")
      .replace(/\{\{franqueado_unidade\}\}/g, franqueado?.nome || "—")
      .replace(/\{\{contratada_nome\}\}/g, franqueado?.nome || "NOEXCUSE")
      .replace(/\{\{contratada_cnpj\}\}/g, "XX.XXX.XXX/0001-XX")
      .replace(/\{\{contratada_endereco\}\}/g, "—")
      .replace(/\{\{numero_contrato\}\}/g, "CTR-XXX")
      .replace(/\{\{data_geracao\}\}/g, new Date().toLocaleDateString("pt-BR"));
  }

  function handleGerar(asDraft: boolean) {
    if (!clienteNome) { toast({ title: "Preencha o nome do cliente", variant: "destructive" }); return; }
    toast({ title: asDraft ? "Rascunho salvo com sucesso!" : "Contrato criado com sucesso!", description: `Status: ${asDraft ? "Rascunho" : "Gerado"}` });
    setStep(0);
    setClienteNome(""); setClienteDoc(""); setClienteEmail(""); setClienteTel("");
    setClienteEndereco(""); setClienteRg("");
    setValorMensal(0); setValorTotal(0); setDataInicio(""); setDataFim("");
    setDuracaoMeses(0); setQtdParcelas(0); setValorParcela(0);
    setServicosDescricao(""); setCidade("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Criar Contratos</h1>
        <Badge variant="secondary" className="mt-1">Franqueadora (acesso total)</Badge>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary cursor-pointer" : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-3 h-3" /> : <span className="w-4 text-center">{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {/* Step 1 */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Tipo de Contrato</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["Assessoria","SaaS","Sistema","Franquia"] as ContratoTipo[]).map(t => (
                <button key={t} onClick={() => { setTipo(t); setTemplateId(""); }}
                  className={`p-4 rounded-lg border-2 text-center font-medium transition-colors ${tipo === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >{t}</button>
              ))}
            </div>
            <div>
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
                <SelectContent>
                  {templatesFiltered.length === 0 && <SelectItem value="_none" disabled>Nenhum template aprovado para {tipo}</SelectItem>}
                  {templatesFiltered.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Dono / Origem</h2>
            <div className="grid grid-cols-3 gap-3">
              {(["Interno","Franqueado","Parceiro"] as ContratoDono[]).map(d => (
                <button key={d} onClick={() => setDono(d)}
                  className={`p-4 rounded-lg border-2 text-center font-medium transition-colors ${dono === d ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >{d}</button>
              ))}
            </div>
            {(dono === "Franqueado" || dono === "Parceiro") && (
              <div>
                <Label>Selecionar {dono}</Label>
                <Select value={franqueadoId} onValueChange={setFranqueadoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{FRANQUEADOS_LIST.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Dados do Cliente</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={clienteNome} onChange={e => setClienteNome(e.target.value)} /></div>
              <div><Label>CPF/CNPJ</Label><Input value={clienteDoc} onChange={e => setClienteDoc(e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={clienteTel} onChange={e => setClienteTel(e.target.value)} /></div>
              <div><Label>RG</Label><Input value={clienteRg} onChange={e => setClienteRg(e.target.value)} placeholder="Ex: 12.345.678-9" /></div>
              <div className="col-span-2"><Label>Endereço</Label><Input value={clienteEndereco} onChange={e => setClienteEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" /></div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Dados da Contratação</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Produto</Label><Input value={tipo} disabled /></div>
              <div><Label>Recorrência</Label>
                <Select value={recorrencia} onValueChange={v => setRecorrencia(v as ContratoRecorrencia)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["Mensal","Anual","Unitária"] as ContratoRecorrencia[]).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor Mensal</Label><Input type="number" value={valorMensal} onChange={e => setValorMensal(Number(e.target.value))} /></div>
              <div><Label>Valor Total</Label><Input type="number" value={valorTotal} onChange={e => setValorTotal(Number(e.target.value))} /></div>
              <div><Label>Duração (meses)</Label><Input type="number" value={duracaoMeses} onChange={e => setDuracaoMeses(Number(e.target.value))} placeholder="Ex: 6" /></div>
              <div><Label>Qtd. Parcelas</Label><Input type="number" value={qtdParcelas} onChange={e => setQtdParcelas(Number(e.target.value))} /></div>
              <div><Label>Valor Parcela</Label><Input type="number" value={valorParcela} onChange={e => setValorParcela(Number(e.target.value))} /></div>
              <div><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Ex: Maringá" /></div>
              <div><Label>Data Início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
              <div><Label>Vincular Proposta</Label><Input placeholder="ID da proposta (futuro)" value={proposta} onChange={e => setProposta(e.target.value)} /></div>
            </div>
            <div><Label>Descrição dos Serviços</Label><Textarea rows={4} value={servicosDescricao} onChange={e => setServicosDescricao(e.target.value)} placeholder="Descreva os serviços contratados (ex: Gestão de Redes Sociais, Criação de Site, etc.)" /></div>
            <div><Label>Observações</Label><Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} /></div>
          </div>
        )}

        {/* Step 5 */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Revisão e Geração</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Tipo:</span> {tipo}</div>
              <div><span className="text-muted-foreground">Dono:</span> {dono}</div>
              <div><span className="text-muted-foreground">Cliente:</span> {clienteNome || "—"}</div>
              <div><span className="text-muted-foreground">Documento:</span> {clienteDoc || "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {clienteEmail || "—"}</div>
              <div><span className="text-muted-foreground">RG:</span> {clienteRg || "—"}</div>
              <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {clienteEndereco || "—"}</div>
              <div><span className="text-muted-foreground">Recorrência:</span> {recorrencia}</div>
              <div><span className="text-muted-foreground">Duração:</span> {duracaoMeses ? `${duracaoMeses} meses` : "—"}</div>
              <div><span className="text-muted-foreground">Valor Mensal:</span> R$ {valorMensal.toLocaleString("pt-BR")}</div>
              <div><span className="text-muted-foreground">Valor Total:</span> R$ {valorTotal.toLocaleString("pt-BR")}</div>
              <div><span className="text-muted-foreground">Parcelas:</span> {qtdParcelas ? `${qtdParcelas}x de R$ ${valorParcela.toLocaleString("pt-BR")}` : "—"}</div>
              <div><span className="text-muted-foreground">Período:</span> {dataInicio || "—"} a {dataFim || "—"}</div>
              <div><span className="text-muted-foreground">Cidade:</span> {cidade || "—"}</div>
              {franqueado && <div><span className="text-muted-foreground">Franqueado:</span> {franqueado.nome}</div>}
            </div>

            {selectedTemplate && (
              <div>
                <Label className="mb-2 block">Preview do Contrato</Label>
                <pre className="bg-muted/50 border rounded-lg p-4 text-xs whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono">{getPreview()}</pre>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleGerar(false)}>Criar Contrato</Button>
              <Button variant="outline" onClick={() => handleGerar(true)}>Salvar Rascunho</Button>
              <Button variant="secondary" onClick={() => toast({ title: "Exportar PDF", description: "Em breve" })}><FileDown className="w-4 h-4 mr-1" />PDF</Button>
              <Button variant="secondary" onClick={() => toast({ title: "Exportar DOCX", description: "Em breve" })}><FileDown className="w-4 h-4 mr-1" />DOCX</Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}><ChevronLeft className="w-4 h-4 mr-1" />Anterior</Button>
          {step < 4 && <Button onClick={() => setStep(s => s + 1)}>Próximo<ChevronRight className="w-4 h-4 ml-1" /></Button>}
        </div>
      </Card>
    </div>
  );
}
