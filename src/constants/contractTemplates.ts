// Default contract templates with placeholders for editable fields

export interface DefaultTemplate {
  name: string;
  template_type: string;
  description: string;
  content: string;
  placeholders: { key: string; label: string; category: string; example: string }[];
}

const FRANCHISE_PLACEHOLDERS = [
  { key: "{{numero_contrato}}", label: "Nº do Contrato", category: "Contrato", example: "001" },
  { key: "{{franqueada_nome}}", label: "Nome Completo", category: "Franqueada", example: "Maria Silva" },
  { key: "{{franqueada_nacionalidade}}", label: "Nacionalidade", category: "Franqueada", example: "brasileira" },
  { key: "{{franqueada_estado_civil}}", label: "Estado Civil", category: "Franqueada", example: "solteira" },
  { key: "{{franqueada_cpf}}", label: "CPF", category: "Franqueada", example: "000.000.000-00" },
  { key: "{{franqueada_rg}}", label: "RG", category: "Franqueada", example: "00.000.000-0" },
  { key: "{{franqueada_email}}", label: "E-mail", category: "Franqueada", example: "email@exemplo.com" },
  { key: "{{franqueada_endereco}}", label: "Endereço", category: "Franqueada", example: "Rua Exemplo, nº 100" },
  { key: "{{franqueada_bairro}}", label: "Bairro", category: "Franqueada", example: "Centro" },
  { key: "{{franqueada_cep}}", label: "CEP", category: "Franqueada", example: "00000-000" },
  { key: "{{franqueada_cidade}}", label: "Cidade", category: "Franqueada", example: "Maringá" },
  { key: "{{franqueada_estado}}", label: "Estado", category: "Franqueada", example: "Paraná" },
  { key: "{{franqueada_cnpj}}", label: "CNPJ (se PJ)", category: "Franqueada PJ", example: "00.000.000/0001-00" },
  { key: "{{franqueada_razao_social}}", label: "Razão Social (se PJ)", category: "Franqueada PJ", example: "Empresa Exemplo LTDA" },
  { key: "{{operador_nome}}", label: "Sócio Operador", category: "Franqueada", example: "João Operador" },
  { key: "{{taxa_adesao_valor}}", label: "Valor Taxa de Adesão", category: "Valores", example: "15.000,00" },
  { key: "{{taxa_adesao_forma}}", label: "Forma Pgto Adesão", category: "Valores", example: "parcelado em 12 vezes no boleto" },
  { key: "{{taxa_manutencao_valor}}", label: "Taxa Mensal Manutenção", category: "Valores", example: "500,00" },
  { key: "{{data_assinatura}}", label: "Data da Assinatura", category: "Datas", example: "27 de fevereiro de 2026" },
];

const SERVICE_PLACEHOLDERS = [
  { key: "{{contratante_razao_social}}", label: "Razão Social", category: "Contratante", example: "Empresa Exemplo LTDA" },
  { key: "{{contratante_cnpj}}", label: "CNPJ", category: "Contratante", example: "00.000.000/0001-00" },
  { key: "{{contratante_endereco}}", label: "Endereço", category: "Contratante", example: "Avenida Exemplo, nº 100" },
  { key: "{{contratante_bairro}}", label: "Bairro", category: "Contratante", example: "Centro" },
  { key: "{{contratante_cep}}", label: "CEP", category: "Contratante", example: "00000-000" },
  { key: "{{contratante_cidade}}", label: "Cidade", category: "Contratante", example: "Maringá" },
  { key: "{{contratante_estado}}", label: "Estado", category: "Contratante", example: "Paraná" },
  { key: "{{servicos_descricao}}", label: "Serviços Contratados", category: "Serviço", example: "Artes: 04 unidades;\nVídeos: 04 unidades;\nProgramação: Meta;\nGestão de Tráfego Pago: Meta e Google;" },
  { key: "{{prazo_meses}}", label: "Prazo (meses)", category: "Serviço", example: "12" },
  { key: "{{valor_setup}}", label: "Valor Setup", category: "Valores", example: "1.000,00" },
  { key: "{{valor_mensal}}", label: "Valor Mensal", category: "Valores", example: "2.500,00" },
  { key: "{{valor_setup_extenso}}", label: "Setup por Extenso", category: "Valores", example: "mil reais" },
  { key: "{{valor_mensal_extenso}}", label: "Mensal por Extenso", category: "Valores", example: "dois mil e quinhentos reais" },
  { key: "{{dia_vencimento}}", label: "Dia de Vencimento", category: "Valores", example: "25" },
  { key: "{{data_assinatura}}", label: "Data da Assinatura", category: "Datas", example: "27 de fevereiro de 2026" },
];

const FRANCHISE_CONTENT = `CONTRATO DE FRANQUIA EMPRESARIAL NOEXCUSE MARKETING DIGITAL N° {{numero_contrato}}

I - QUALIFICAÇÃO DAS PARTES

A FRANQUEADORA NOEXCUSE MARKETING DIGITAL, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob n° 34.638.745/0001-00, com endereço na Avenida Carneiro Leão, nº 294, sala 06, CEP 87014-010, na cidade de Maringá, Estado do Paraná;

A FRANQUEADA {{franqueada_nome}}, {{franqueada_nacionalidade}}, {{franqueada_estado_civil}}, inscrito sob o CPF nº {{franqueada_cpf}}, RG n° {{franqueada_rg}}, com endereço eletrônico {{franqueada_email}}, residente e domiciliado na {{franqueada_endereco}}, bairro {{franqueada_bairro}}, CEP {{franqueada_cep}}, na cidade {{franqueada_cidade}}, Estado do {{franqueada_estado}}.

CASO SEJA PESSOA JURÍDICA/CNPJ:

A FRANQUEADA {{franqueada_razao_social}}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº {{franqueada_cnpj}}, com endereço eletrônico {{franqueada_email}}, com sede empresarial na {{franqueada_endereco}}, bairro {{franqueada_bairro}}, CEP {{franqueada_cep}}, na cidade de {{franqueada_cidade}}, Estado do {{franqueada_estado}}.

II - CONSIDERAÇÕES INICIAIS

1. A FRANQUEADORA é titular dos direitos de uso da marca, nome comercial e logotipo NOEXCUSE Marketing Digital através do sistema de franquias, cujo o pedido de seu registro de marca foi depositado junto ao INPI com os registros/protocolos n° 917844955, que autoriza o uso de sua logomarca nominativa e figurativa nas suas unidades, bem como em sua linha completa de produtos e serviços.
2. A FRANQUEADORA exerce controle efetivo sobre as especificações, natureza e qualidade dos seus respectivos produtos e serviços registrados, com amparo na Lei n° 9.279/96.
3. A FRANQUEADA recebeu a Circular de Oferta de Franquia NOEXCUSE Marketing Digital elaborada pela FRANQUEADORA nos termos da Lei n° 13.966 de 26 de dezembro de 2019, que reflete informações e particularidades da franquia (anexo I), tendo a estudado e tido a oportunidade de discutir seus termos com a FRANQUEADORA, estando interessada em se tornar um novo membro da rede de franquias.
4. A FRANQUEADA está ciente que o Sistema de Franquia se baseia no cumprimento de regras e procedimentos formatados pela FRANQUEADORA e que como negócio também está sujeito a riscos, não tendo recebido qualquer garantia de rentabilidade, lucratividade ou faturamento por parte da FRANQUEADORA.
5. A FRANQUEADORA não garante à FRANQUEADA sucesso ou lucro financeiro em decorrência da implantação e operação da sua franquia e/ou da utilização do sistema de franquia NOEXCUSE Marketing Digital, uma vez que tal sucesso dependerá da conjuntura econômica do país e, acima de tudo, do tempo, esforço e atenção que a FRANQUEADA dedicar à operação e administração do NEGÓCIO FRANQUEADO.
6. As partes estão cientes que o presente Contrato de Franquia Empresarial é firmado em caráter Intuitu Personae, tendo por base a figura da sócia operadora {{operador_nome}}, e que deverá exercer o controle societário e/ou a gerência da empresa FRANQUEADA, bem como dedicar a maior parte de seu tempo útil e seus melhores esforços ao cotidiano operacional do NEGÓCIO FRANQUEADO.
7. Em virtude destes fatores, por fruir de grande aceitabilidade e credibilidade perante aos consumidores, a FRANQUEADORA, com interesse em expandir a sua atuação no mercado, e, por outro lado, a FRANQUEADA interessada em utilizar a marca, logotipo e toda sistemática comercial, "know-how" da FRANQUEADORA, têm entre si, justo e acertado, o presente Contrato Particular de Franquia Empresarial, que se regerá pelas cláusulas e condições abaixo consignadas:

III - DO OBJETO

O presente contrato tem como objeto a concessão, em caráter não exclusivo, da licença feita pela FRANQUEADORA à FRANQUEADA de todo o "know-how" desenvolvido pela FRANQUEADORA, para explorar o NEGÓCIO FRANQUEADO, abrangendo todos os produtos oferecidos pela empresa NOEXCUSE Marketing Digital, bem como sua marca, além do direito de uso do seu sistema administrativo, mercadológico, comercial e operacional.

IV - DA FRANQUEADORA E SUAS OBRIGAÇÕES

1. A FRANQUEADORA desenvolveu um conceito próprio de negócio, sendo detentora da marca NOEXCUSE Marketing Digital e também é a legítima detentora de conhecimentos, técnicas, know-how e tecnologias relacionadas ao planejamento, implantação, operação e gestão desse negócio.
2. A FRANQUEADORA conta com profissionais com extenso currículo, experiência e profissionalismo no mercado digital, com conhecimento nas áreas de construção de site institucional, hotsite e loja virtual, gerenciamento de mídias sociais, elaboração de logotipos e e-books, otimização SEO leads, criação de Google, Facebook e Instagram Ads, produção de aplicativos, vídeos animados 2D, cartão digital, elaboração de materiais de papelarias empresariais e consultoria, de forma que está apta a proporcionar o FRANQUEADO esse know how com o fim de implementar, operar e gerir o negócio.
3. Para consecução de seu objetivo, caberá a FRANQUEADORA disponibilizar video aulas de treinamento adequado e, caso solicitado, agendamento para treinamentos presenciais ou on-line para a FRANQUEADA, de acordo com seu padrão e prestando todo suporte necessário para que à FRANQUEADA atinja o padrão de qualidade definido neste contrato, nos manuais fornecidos ao longo da implantação da franquia e das atualizações do software.

V - DO FRANQUEADO E SUAS OBRIGAÇÕES

1. Para manutenção do negócio, é imprescindível que um dos sócios da FRANQUEADA figure no quadro social da empresa.
2. É vedado à FRANQUEADA, desde o seu ingresso na rede de franquias NOEXCUSE Marketing Digital, exercer quaisquer atividades relacionadas, diretamente ou indiretamente ao NEGÓCIO FRANQUEADO, por si ou mediante participação, direta ou indireta, como sócios, cotistas ou acionistas, bem como administradores e/ou colaboradores ou a qualquer tipo título, de sociedade ou empresa congênere e/ou concorrente ao NEGÓCIO FRANQUEADO ou à FRANQUEADORA, sem que esta última o autorize expressamente.
3. A FRANQUEADA não poderá expor, divulgar ou comercializar produtos/serviços que não estejam arrolados no presente instrumento, salvo se devidamente autorizado por escrito pela FRANQUEADORA.
4. A FRANQUEADA obriga-se, desde logo, a permitir livre acesso dos representantes, funcionários ou credenciados da FRANQUEADORA e acatar as sugestões ou orientações que lhe sejam formuladas pela FRANQUEADORA no sentido de aperfeiçoar e elevar seu padrão ou atuação.
5. É dever da FRANQUEADA manter seus funcionários atualizados e qualificados para que o atendimento continue a ter o mesmo prestígio ora mantido pela FRANQUEADORA.
6. A FRANQUEADA deverá manter sigilo de todas as informações e dados passados pela empresa FRANQUEADORA durante a vigência do presente instrumento e após sua rescisão.
7. A FRANQUEADA se compromete a não passar informações confidenciais a seus funcionários, se restringindo apenas a dar orientações e informações imprescindíveis a um bom desempenho de suas tarefas.
8. A FRANQUEADA deve difundir, promover e proteger a marca NOEXCUSE Marketing Digital, assim como da pessoa física e jurídica da FRANQUEADA, evitando quaisquer formas de desabono.
9. É dever da FRANQUEADA zelar pelo bom nome e boa reputação da empresa FRANQUEADORA, não praticando nenhum ato que prejudique de qualquer modo a grande aceitabilidade e credibilidade que esta detém perante seus consumidores e fornecedores.
10. É obrigação da FRANQUEADA adimplir, de forma regular e tempestiva, todas as taxas, continuadas ou não, previstas neste instrumento e continuamente assumir e cumprir todas e quaisquer responsabilidades relativas ao seu negócio.
11. A FRANQUEADA deve pagar todos os débitos contraídos para operação da franquia e não assumir nenhuma obrigação ou despesa, de qualquer natureza, em nome da FRANQUEADORA, ou de qualquer outra empresa ou indivíduo a ela associada.
12. A FRANQUEADA se compromete em repassar aos seus funcionários os vídeos e cursos disponibilizados pela FRANQUEADORA, quando estes forem referentes à operação da franquia.
13. A FRANQUEADA não deve alterar a sua composição societária, sem prévia e expressa autorização da FRANQUEADORA.
14. A FRANQUEADA tem o compromisso de manter relatórios e registro contábeis regulares, totais, completos e precisos do NEGÓCIO FRANQUEADO, de acordo com as normas estabelecidas pela legislação vigente.
15. A FRANQUEADA deve fornecer à FRANQUEADORA o demonstrativo financeiro anual, inclusive o demonstrativo de perdas e lucros e/ou o balanço preparado de acordo com os princípios contábeis vigentes e dentro do prazo de 30 (trinta) dias de sua solicitação.
16. A FRANQUEADA deverá possuir um sócio operador ou preposto que dedique a maior parte de seu tempo útil e seus melhores esforços na operação do NEGÓCIO FRANQUEADO e que tenha sido formalmente aprovado pela FRANQUEADORA durante o treinamento obrigatório.
17. A FRANQUEADA se compromete a manter ativo o canal de comunicação com a FRANQUEADORA, através da intranet ou e-mail.
18. A FRANQUEADA deve obedecer às regras e normas do Código de Defesa do Consumidor, principalmente quanto aos procedimentos de vigência dos produtos e de atendimento ao público consumidor, cumprindo o disposto nos manuais e deixando uma cópia do Código de Defesa do Consumidor à disposição dos clientes, conforme determina a lei.
19. É sua obrigação obter e apresentar à FRANQUEADORA, quando requisitadas, todas as licenças, alvarás e/ou autorizações necessárias para o exercício de sua atividade, bem como observar todas as leis ou determinações de autoridades públicas e todas as instruções da FRANQUEADORA relativas ao funcionamento da unidade.

VI - DAS TAXAS DE ADESÃO, REMUNERAÇÃO E ROYALTIES

1. A taxa de adesão da franquia ao FRANQUEADO é no valor de: R$ {{taxa_adesao_valor}} a ser pago da seguinte forma: {{taxa_adesao_forma}}. Em contrapartida, o FRANQUEADO receberá todas as regras, normas, treinamentos e procedimentos pertinentes ao sistema de franquia NOEXCUSE Marketing Digital.
2. Responsabilizar-se pela continuidade e gestão do NEGÓCIO FRANQUEADO, tendo em vista que é empresa independente, gerida de forma autônoma pela FRANQUEADA, mantendo todas as informações e instruções sobre o NEGÓCIO FRANQUEADO na mais estrita confidencialidade.
3. A FRANQUEADA se compromete a pagar a taxa mensal de manutenção/administração no valor de R$ {{taxa_manutencao_valor}}, os quais poderão sofrer reajustes e outras obrigações financeiras com a FRANQUEADORA ou perante terceiros pontualmente, e, não se comportando dessa maneira, o contrato poderá ser rescindido por culpa exclusiva daquela.
4. A FRANQUEADA será remunerada mediante uma comissão obtida pela venda dos produtos e serviços homologados após o recebimento das devidas verbas pelo cliente, conforme percentual e prazos por ela definidos quando da contratação pelo mesmo, descontados os tributos e os royalties (remuneração líquida).
5. A título de royalties, isto é, pelo uso da marca e por figurar na rede de franquias NOEXCUSE Marketing Digital, será devido pela FRANQUEADA à FRANQUEADORA o pagamento mensal da quantia correspondente a 1% (um por cento) do seu comissionamento bruto.
6. Do comissionamento bruto da FRANQUEADA serão, ainda, descontados os impostos diretos incidentes e pagos pela FRANQUEADORA, no valor de 10% (dez por cento), podendo este sofrer reajustes sem aviso prévio.
7. Os comissionamentos serão repassados a FRANQUEADA até o 15º (décimo quinto) dia útil do mês.
8. Se o cliente da FRANQUEADA não honrar os pagamentos, nenhuma remuneração será devida pela FRANQUEADORA.
9. O não pagamento da Taxa de Manutenção/Administração, Taxa de Royalties e Taxa de utilização do software (sistema) por parte da FRANQUEADA dá a FRANQUEADORA o direito de interromper as licenças de uso e a prestação de todos os serviços, a seu critério exclusivo, bem como o direito de rescindir o CONTRATO DE FRANQUIA.
10. Caso forem encontradas fraudes no sistema de faturamento, será devido pela FRANQUEADA uma cláusula penal no valor equivalente 10 (dez) salários mínimos nacionais, podendo, a critério da FRANQUEADORA, perder o direito de utilização da marca NOEXCUSE marketing digital, com a rescisão do CONTRATO DE FRANQUIA.
11. A FRANQUEADA deverá manter e preservar, durante a vigência do presente Contrato e até o período de 5 (cinco) anos depois, registros contábeis completos e acurados, prestando toda e qualquer informação solicitada pela FRANQUEADORA para verificação do cumprimento dos termos deste Contrato.
12. Não haverá cobranças de taxas mensais de fundo de publicidade e propaganda.

VII - DA ALIENAÇÃO E SUCESSÃO

1. O contrato poderá ser cedido mediante aceitação da FRANQUEADORA dos novos operadores e mediante o pagamento de 100% (cem por cento) da Taxa de Franquia vigente e 100% (cem por cento) da Taxa de Análise, Treinamento e Implantação vigente, a ser feito pela FRANQUEADA antes da transferência, mantendo ainda aqui as condições firmadas.
2. No caso de venda parcial das quotas da empresa, o novo sócio não poderá atuar em segmentos concorrentes sob qualquer título.
3. Em qualquer das hipóteses, possui a FRANQUEADORA o direito de preferência, devendo ser previamente notificada.
4. Eventual discordância da FRANQUEADORA da cessão e/ou dos novos operadores não precisa ser justificada.

VIII - DA VIGÊNCIA E DA RENOVAÇÃO

1. O Contrato de Franquia vigorará pelo prazo de 03 (três) anos, contados da data deste contrato.
2. A prorrogação do presente contrato acontecerá automaticamente, por igual período, caso não haja prévia notificação por escrito de qualquer das partes com antecedência mínima de 30 dias da data do término do contrato, comunicando sua intenção de rescindi-lo.
3. Para consolidação da renovação do presente contrato, a FRANQUEADA deverá arcar com a TAXA DE RENOVAÇÃO, fixada em 5% (cinco por cento) do valor da Taxa Inicial de Franquia praticado pela FRANQUEADORA à época da renovação.
4. Havendo a renovação contratual, a taxa de royalties incidente será aquela vigente na época da renovação.
5. Não sendo renovado este contrato, a FRANQUEADORA não estará obrigada a devolver à FRANQUEADA qualquer quantia já recebida, em especial, as taxas de franquia e royalties.
6. Em caso de não renovação, a FRANQUEADA deverá devolver todos os materiais recebidos e disponibilizados, em especial os MANUAIS.

IX - CONFIDENCIALIDADE E NÃO CONCORRÊNCIA

1. A FRANQUEADA se compromete, por si, seus sócios, prepostos, ascendentes e descendentes, a manter a mais estrita confidencialidade em relação ao conteúdo dos manuais, bem como de todas as instruções ou quaisquer informações que vier a receber da FRANQUEADORA ou que tomar conhecimento em decorrência do presente Contrato, mesmo após o término ou rescisão deste instrumento, devendo a FRANQUEADA, neste caso, também devolver imediatamente a FRANQUEADORA todo material dela recebido para a consecução do presente Contrato, em especial, os manuais.
2. Como parte do compromisso de manter a confidencialidade das informações recebidas, a FRANQUEADA deverá firmar acordo com seus gerentes, funcionários e/ou colaboradores, exigindo a manutenção de estrito sigilo e confidencialidade das informações e conhecimentos técnicos que vierem a receber ou tomar conhecimento em decorrência da comercialização de produtos, durante e após o término do vínculo empregatício ou comercial com a FRANQUEADORA.
3. Durante a vigência deste instrumento e mesmo após, durante um período de, no mínimo, 5 (cinco) anos, a FRANQUEADA compromete-se a deixar de oferecer, por si ou através de terceiros, quaisquer produtos, idênticos ou similares àqueles vinculados à marca NOEXCUSE Marketing Digital ou qualquer produto que, direta ou indiretamente, seja a ele concorrente ou possa vir a confundir os consumidores finais acerca da marca.
4. A FRANQUEADA reconhece que não poderá reivindicar ou alegar, de qualquer forma, sob nenhum pretexto e em tempo algum, qualquer direito ou licença sobre as informações prestadas pela FRANQUEADORA em decorrência do presente instrumento, salvo os direitos expressamente outorgados à FRANQUEADA por meio do presente Contrato.
5. A não observância do disposto nos itens acima importará, se for o caso, na imediata rescisão deste instrumento, bem como no pagamento de uma multa de 20 (vinte) salários mínimos vigentes à época da infração, bem como arcar com todos os prejuízos que vier a causar à FRANQUEADORA, valendo a cláusula como mínimo de indenização.

X - INDEPENDÊNCIA DAS PARTES CONTRATANTES

1. Não existe qualquer coligação ou consórcio entre as partes constantes neste contrato, sendo a FRANQUEADA e a FRANQUEADORA, pessoas jurídicas distintas e independentes, de modo que a FRANQUEADA responderá com seu nome e capital pelas obrigações contraídas durante a validade do presente contrato.
2. A FRANQUEADA assume total responsabilidade civil sobre os seus atos, seja perante a Sociedade Civil, seja perante o Estado.
3. A FRANQUEADA será a única responsável pelo cumprimento das legislações municipais, estaduais e federais no que se refere às suas obrigações como empresário, quer as de ordem tributária, quer as de ordem trabalhistas e outras, especialmente os dispositivos legais que tratam do ramo de corretagem de seguros, além de praticar atos responsáveis nas esferas comerciais e financeiras perante o mercado, seja durante ou depois do término de vigência deste instrumento.
4. A FRANQUEADA, quando solicitada, deverá exibir à FRANQUEADORA a comprovação de pagamento de tributos e encargos sociais sob sua responsabilidade.
5. O presente contrato não firma em quaisquer hipóteses vínculo trabalhista ou associativo entre a FRANQUEADORA e a FRANQUEADA, bem como entre qualquer delas e os funcionários ou prepostos da outra.
6. Fica certo e ajustado, ainda, que todos e quaisquer processos administrativos ou ações judiciais referentes à atividade comercial da FRANQUEADA junto a órgãos federais, estaduais e municipais, bem como, junto ao PROCON, ANVISA e consumidores, são de sua única e exclusiva responsabilidade.
7. Caso a FRANQUEADORA venha ser acionada judicialmente por qualquer pessoa ligada à FRANQUEADA, sejam seus sócios, empregados ou terceiros, a FRANQUEADA deverá ingressar no processo, requerendo a exclusão da FRANQUEADORA, isentando-a de toda e qualquer responsabilidade com relação a tais fatos e assumindo integralmente o litígio.
8. Se, mesmo assim, a FRANQUEADORA for condenada a pagar qualquer quantia a terceiros por ato da FRANQUEADA, compromete-se esta a ressarcir a FRANQUEADORA, integralmente, não só com relação aos valores por esta despendidos, como, ainda, com relação a todas as custas processuais desembolsadas e honorários advocatícios, tudo em prazo não superior a 10 (dez) dias contados do trânsito em julgado da demanda ou do pagamento efetuado pela FRANQUEADORA, o que acontecer primeiro.
9. A FRANQUEADA deve informar e encaminhar à FRANQUEADORA as cópias de todos os documentos gerados em conflitos judiciais ou extrajudiciais, envolvendo diretamente a pessoa jurídica responsável pelos negócios de sua Unidade FRANQUEADA, desde que os mesmos possam vir a repercutir na imagem e na reputação da Marca NOEXCUSE marketing digital.

XI - RESCISÃO CONTRATUAL

1. Caso haja mútuo consenso entre FRANQUEADA e FRANQUEADORA quanto à rescisão bilateral da Franquia, as partes contratantes comprometer-se-ão a redigir termo por escrito, discriminando os motivos que o levaram a tal atividade, possíveis débitos e créditos, forma de pagamento, indenização, entre outros assuntos que contribuam para a extinção amigável e quitação da relação contratual até então vigente.
2. A FRANQUEADORA, por ato unilateral, dará por rescindido o presente contrato nas seguintes hipóteses:
2.1 Falência, insolvência, pedido de concordata, intervenção, liquidação ou dissolução de qualquer uma das partes ou configuração de situação pré-falimentar ou de pré-insolvência;
2.2 Se a FRANQUEADA deixar de sanar as falhas cometidas depois de advertido pela FRANQUEADORA;
2.3 Desobediência, pela FRANQUEADA, de sua obrigação de não concorrência, nos termos deste contrato;
2.4 Cessão de direitos do presente contrato para terceiros, sem prévia e expressa autorização de uma das partes;
2.5 Inadimplência financeira junto à FRANQUEADORA ou fornecedores homologados sobre a aquisição de produtos, em prazo superior a 90 (noventa) dias consecutivos e sem negociação;
2.6 O fornecimento por parte da FRANQUEADA à FRANQUEADORA de informações falsas ou inexatas ao longo da relação;
2.7 Práticas fraudulentas na inserção de informações falsas no sistema, ou condutas prejudiciais tanto à reputação quanto prejuízos de ordem financeira à FRANQUEADORA;
2.8 Se a FRANQUEADA adquirir produtos de outro fornecedor que não aqueles indicados pela FRANQUEADORA;
2.9 Se a FRANQUEADA praticar condutas ilícitas ou prejudiciais ao bom nome da marca no mercado;
2.10 Caso a FRANQUEADA impeça, desacate ou dificulte as visitas de campo realizadas pela FRANQUEADORA ou por quem está vier a indicar;
2.11 Por sonegar ou dificultar à FRANQUEADORA a obtenção de informações referentes ao NEGÓCIO FRANQUEADO.
3. A FRANQUEADORA pode considerar as práticas do item acima infrações, sendo assim, ao invés da rescisão imediata do presente instrumento, poderá ser aplicada uma multa no valor de 1 (um) salário mínimo vigente à época como penalização, por dia ou por falta.
4. Na hipótese de ficar constatada violação de qualquer das cláusulas deste Contrato, a parte inocente deverá notificar a outra, para que, no prazo de 72 (setenta e duas) horas a contar do recebimento da notificação, cesse a prática violadora, sob pena de rescisão do presente instrumento.
5. A FRANQUEADA indenizará a FRANQUEADORA, a título de multa contratual, em razão do rompimento do presente contrato, seja por descumprimento contratual (rescisão unilateral) ou pela vontade própria de desfazer o negócio, a quantia correspondente a 30% (trinta por cento) do valor bruto do faturamento dos últimos 12 (doze) meses da Unidade FRANQUEADA, com o mínimo de 20 (vinte) salários mínimos, sem prejuízo das perdas e danos que em juízo forem apuradas, se for o caso.
5.1 Se a FRANQUEADA estiver operando há menos de 12 (doze) meses, a multa será fixa no valor de 20 (vinte) salários mínimos.
6. Na hipótese de rescisão deste contrato, independentemente do motivo, ficará proibida a exploração de segmento concorrente NEGÓCIO FRANQUEADO NOEXCUSE Marketing Digital pela FRANQUEADA, pelo prazo de 5 anos, sob pena das medidas judicias cabíveis, mais indenização já pré-fixada em valor não inferior à 250 (duzentos e cinquenta) salários mínimos nacionais vigentes a época.
7. Caso este Contrato venha a ser rescindido com a FRANQUEADA por descumprimento contratual ou pelo distrato, nenhuma indenização lhe será devida pelas despesas que tiver realizado.
8. Se o contrato vencer e não for renovado ou for rescindido por qualquer uma das partes, qualquer que seja o motivo, a FRANQUEADA não mais poderá usar a marca da FRANQUEADORA, devolvendo todos os documentos que lhe foram entregues em decorrência deste instrumento, sob pena de multa diária de 1 (um) salário mínimo nacional vigente a época.
9. Caso haja recusa de cumprimento do estabelecido no item acima, a FRANQUEADORA poderá, a qualquer tempo e sem necessidade de autorização prévia ou caução, buscar e apreender na UNIDADE todos os materiais relativos a REDE DE FRANQUIAS NOEXCUSE Marketing Digital.
10. Se o contrato vencer e não for renovado ou for rescindido por qualquer uma das partes, a FRANQUEADA deverá, ainda, saldar todos os débitos à FRANQUEADORA.
11. No caso de morte ou incapacidade do sócio operador, o presente contrato estará rescindido de pleno direito.
12. No ato da rescisão deste instrumento a FRANQUEADA deve passar imediatamente à FRANQUEADORA o cadastro de clientes e qualquer outra informação referente ao mercado local que esteja em sua posse.

XII - DECLARAÇÕES DA FRANQUEADA

1. A FRANQUEADA declara que leu este contrato em sua íntegra e que a ela foi dada a oportunidade de esclarecer qualquer dispositivo e informação que não tivesse entendido.
2. A FRANQUEADA reconhece que foi recomendada pela FRANQUEADORA a consulta a advogados, contadores e corretores antes da assinatura do presente Contrato.
3. A FRANQUEADA compreende também que, dada à natureza dinâmica da presente franquia e pelo fato de não se estar tratando de contrato de adesão, outros contratos apresentados e/ou assinados com outros franqueados poderão conter cláusulas e condições diferenciadas.
4. A FRANQUEADA declara-se plenamente consciente que a presente franquia, como qualquer outro negócio, envolve risco e que não existem quaisquer garantias de faturamento ou lucratividade por parte da FRANQUEADORA.
5. A FRANQUEADA declara que compreende que não basta, para ser uma unidade FRANQUEADA, o capital inicial para a abertura da unidade e para o pagamento das taxas descritas neste instrumento, é preciso, ainda, deter capital suficiente também para o giro da operação e para a realização de investimentos.
6. A FRANQUEADA declara que não recebeu qualquer tipo de indução quanto a estimativas de vendas ou lucros futuros.
7. A FRANQUEADA declara estar plenamente consciente do teor completo da Lei n° 13.966 de 26 de dezembro de 2019, que dispõe sobre o contrato de franquia empresarial (franchising).
8. A FRANQUEADA declara, ainda, que a CIRCULAR DE OFERTA DE FRANQUIA lhe foi entregue há mais de 10 (dez) dias a contar da presente data.
9. A FRANQUEADA declara, por fim, que recebeu todos os treinamentos necessários para funcionamento da sua unidade.

XIII - DA LEI GERAL DE PROTEÇÃO DE DADOS

1. O Franqueado declara-se ciente dos termos contidos na Lei Geral de Proteção de Dados – Lei nº 13.709, de 14 de agosto de 2018 – (LGPD), obrigando-se ao seu fiel cumprimento.
2. Coletar e tratar regularmente, exclusivamente para as finalidades dos contratos, os dados pessoais, realizando o tratamento dos dados com a base legal adequada.
3. Garantir que a coleta dos dados pessoais de pretensos clientes se dará somente mediante a apresentação de proposta devidamente preenchida e assinada pelo cliente.
4. Não utilizar os dados pessoais e/ou dados pessoais sensíveis coletados junto aos clientes para finalidades diversas.
5. Não transferir, ceder, ou transmitir, no todo ou em parte, a terceiros.
6. Não realizar transferências internacionais de dados pessoais sem a prévia e expressa autorização por escrito da FRANQUEADORA e do titular.
7. Manter rigoroso controle sobre quaisquer dados pessoais, anonimizando os dados sempre que possível.
8. Adotar técnicas que assegurem a inviolabilidade e confidencialidade dos dados pessoais.
9. Manter registro de todos os atos que envolvam tratamento de dados pessoais.
10. Adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais.
11. Comunicar à FRANQUEADORA qualquer situação de vazamento de dados.
12. Responder na forma da lei pelos prejuízos que causar à FRANQUEADORA e/ou ao titular dos dados.
13. Consultar a FRANQUEADORA, previamente e por escrito, a respeito de qualquer dúvida quanto ao cumprimento da LGPD.
14. As Partes declaram que os deveres de confidencialidade deverão permanecer em vigor mesmo após o término de vigência do presente contrato.

XIV - DISPOSIÇÕES GERAIS

1. Todos os avisos e notificações que se referem a este Contrato devem ser enviados por escrito.
2. As partes se obrigam a guardar na execução do presente contrato os princípios da probidade e boa-fé.
3. As cláusulas deste contrato deverão ser sempre interpretadas de modo a permitir a correta implantação e manutenção da Unidade FRANQUEADA.
4. Este Contrato somente poderá ser alterado mediante termo aditivo, assinado por ambas as Partes.
5. A tolerância, por qualquer uma das partes, quanto ao inadimplemento das obrigações contratuais não implica em novação ou modificação das cláusulas.
6. A renúncia ou decadência de qualquer dos direitos atinentes às partes contratantes não constituirá renúncia dos demais direitos.
7. Ressalvada as cláusulas que já contêm penalidades específicas, em caso de descumprimento de quaisquer outras cláusulas, incorrerá a parte infratora na cláusula penal no valor de 5 (cinco) salários mínimos.
8. Os tributos e demais encargos fiscais que sejam devidos em razão deste contrato serão de exclusiva responsabilidade do contribuinte correspondente.
9. O presente contrato obriga os herdeiros ou sucessores das partes e terá vigência a partir da sua assinatura.

Para dirimir quaisquer controvérsias acerca do presente contrato, as partes elegem o foro da comarca de Maringá-PR, com renúncia expressa de quaisquer outros, por mais privilegiados que sejam.

E, por estarem assim às partes, justas e contratadas, firmam o presente instrumento em 3 (três) vias, de igual teor e forma, o qual segue assinado pelas testemunhas abaixo, ao mesmo se conferindo o caráter de título executivo extrajudicial, para todos os efeitos legais, nos termos do artigo 784, III do CPC/2015.

Maringá, {{data_assinatura}}.

_________________________          _________________________
Franqueadora                       Franqueado
NOEXCUSE MARKETING DIGITAL         {{franqueada_razao_social}}
CNPJ: 34.638.745/0001-00           CPF/CNPJ: {{franqueada_cpf}}

_________________________          _________________________
Testemunha 1                       Testemunha 2`;

const SERVICE_CONTENT = `CONTRATO PRESTAÇÃO DE SERVIÇO

Pelo presente instrumento as partes abaixo nomeadas e qualificadas, a saber:

A CONTRATANTE {{contratante_razao_social}}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº {{contratante_cnpj}}, com sede empresarial na {{contratante_endereco}}, {{contratante_bairro}}, CEP {{contratante_cep}}, na cidade de {{contratante_cidade}}, Estado do {{contratante_estado}}.

A CONTRATADA NOEXCUSE MARKETING DIGITAL, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob número 34.638.745/0001-00, com endereço na Avenida Carneiro Leão, nº 294, sala 06, Zona Armazém, CEP 87014-010, na cidade de Maringá, Estado do Paraná;

RESOLVEM, firmar o presente contrato, conforme os termos, cláusulas e condições que abaixo livremente estipulam, aceitam, outorgam e pactuam, obrigando-se a cumpri-las a qualquer tempo, por si e por seus herdeiros e sucessores a qualquer título:

CLÁUSULA PRIMEIRA – DO OBJETO

Pelo presente instrumento e na melhor forma de direito, a CONTRATANTE resolve contratar a CONTRATADA para prestar os serviços listados a seguir e conforme documento em anexo (tabela de produtos):

Entregas Mensais:
{{servicos_descricao}}

Todos os serviços prestados pela CONTRATADA exigem o preenchimento do briefing, o qual é um questionário detalhado com todas as informações necessárias para a criação/desenvolvimento do produto contratado. O briefing será disponibilizado em forma de arquivo e a CONTRATANTE terá o prazo de 03 (três) dias úteis para preenchimento. É de obrigação da CONTRATANTE o preenchimento desse arquivo, o qual é indispensável para a execução do que foi contratado.

CLÁUSULA SEGUNDA - DAS ALTERAÇÕES

Após a finalização da produção, serão enviados ao CONTRATANTE para aprovação, onde este deverá cumprir os prazos estabelecidos e informados na reunião de onboarding, para solicitação de alterações e envio de materiais caso necessário.

CLÁUSULA TERCEIRA - DAS ENTREGAS

Os materiais solicitados à CONTRATANTE deverão ser entregues no prazo pré-estabelecido, conforme reunião de onboarding. Caso necessário a CONTRATANTE poderá solicitar a prorrogação do prazo uma única vez por igual período, mediante aviso prévio com no mínimo 24 horas de antecedência.

Observação: Caso a CONTRATANTE, mesmo após solicitação de prorrogação de prazo, não realize as entregas ou incida em novo atraso, terá como penalização a continuidade do seu contrato, conforme pré-estabelecido inicialmente, não se responsabilizando a CONTRATADA por eventuais perdas de produção e utilização.

CLÁUSULA QUARTA – DO PRAZO

A CONTRATANTE contrata os serviços da CONTRATADA para realização de criação/desenvolvimento dos serviços mencionados na cláusula Primeira "do Objeto" no prazo total de {{prazo_meses}} (meses), o prazo contratual passará a contar a partir da entrega final do briefing aprovado pela parte CONTRATADA.

Observação: Caso a CONTRATANTE opte pela renovação do contrato, esta deverá ser feita por meio de aditivo contratual.

CLÁUSULA QUINTA – DO PAGAMENTO

a) Fica acordado entre as partes para a prestação dos serviços supramencionados o valor de R$ {{valor_setup}} ({{valor_setup_extenso}}), em um único pagamento referente à taxa setup, e mensalmente durante {{prazo_meses}} meses o valor de R$ {{valor_mensal}} ({{valor_mensal_extenso}}), referente às entregas mensais pagos no dia {{dia_vencimento}} e as demais parcelas no mesmo dia dos meses subsequentes;

b) O pagamento dos valores poderá ser realizado via pix, boleto ou cartão.
- Obs: A quantidade de parcelas limita-se ao prazo do contrato;
- Obs: Serviços parcelados no cartão de crédito estão sujeitos à taxas e juros, consultar condições.

c) Todos os serviços serão realizados somente após a confirmação do pagamento da primeira parcela e aprovação final do briefing, o qual deverá ser preenchido de forma correta e completa, sendo esta de inteira responsabilidade da CONTRATANTE;

d) Os serviços que forem realizados de acordo com o briefing e que forem suspensos, serão pagos proporcionalmente, conforme descrito na cláusula Primeira "do Objeto", por aquilo que já foi realizado;

e) Na falta de pagamento de qualquer parcela dos valores acordados, acarretará no protesto do presente título, e ainda, a inclusão do nome do contratante no cadastro de inadimplentes disponíveis.

f) Além das penalidades do item e, os serviços em desenvolvimento serão imediatamente suspensos, bem como serviços já entregues serão tirados do ar;

g) O atraso no pagamento de qualquer parcela resultará na cobrança com juros de 2% (dois por cento) por mês de atraso;

h) Os parcelamentos em até 3 (três) vezes não serão acrescidos valores de taxas de cartão de crédito/boleto. A partir da terceira parcela, haverá acréscimos de taxas, os quais serão acordados diretamente entre as partes contratantes;

1. Após o recebimento do briefing a CONTRATADA terá o prazo de três dias úteis para análise do mesmo para iniciar o desenvolvimento dos produtos, ou ainda, devolução para correção;
2. Na contratação de Facebook e Instagram Ads é indispensável que o cliente invista um valor de sua escolha para os anúncios. Esses valores serão pagos diretamente à plataforma do Facebook;
3. Na contratação de Google Ads é indispensável que o cliente invista um valor de sua escolha para os anúncios. Esses valores serão pagos diretamente à plataforma do Google;
4. Na contratação de Site/Landing Page a CONTRATANTE tem a obrigação de realizar o pagamento da hospedagem e compra do domínio.

CLÁUSULA SEXTA – DAS OBRIGAÇÕES DAS PARTES

Além de outras obrigações previstas neste contrato, a CONTRATADA se obriga a:
1. Utilizar-se de profissionais capacitados e habilitados, para a fiel execução dos serviços a serem executados;
2. Dar ciência à CONTRATANTE, imediatamente, por escrito, de qualquer anormalidade que verificar na execução dos serviços;
3. Responder por eventuais infrações à legislação;

Além de outras obrigações previstas neste contrato, a CONTRATANTE se obriga a:
1. Preencher corretamente o briefing, no prazo máximo de 15 (quinze) dias úteis;
2. Não entregar nem dar conhecimento a terceiros não autorizados pela CONTRATADA, qualquer material que decorra da prestação dos serviços;
3. A CONTRATANTE não poderá transmitir obrigações a terceiros, pois a responsabilidade é exclusiva da empresa CONTRATANTE;
4. É da responsabilidade da CONTRATANTE a revisão e aprovação dos serviços contratados;
5. A execução dos serviços contratados somente se dará início após a CONTRATADA receber esse documento assinado em todas as páginas pela CONTRATANTE.

CLÁUSULA SÉTIMA - DA RESCISÃO

1. Em caso de tentativas de contato com a CONTRATANTE e esta permanecer inerte por mais de 10 (dez) dias, seu prazo de entrega será reiniciado a partir da data da sua resposta. Decorrido o prazo de 60 (sessenta) dias sem qualquer resposta da CONTRATANTE, o seu contrato será automaticamente cancelado, sem direito a qualquer reembolso.
2. Em caso de rescisão de contrato por culpa exclusiva da CONTRATANTE, seja para quaisquer produtos contratados, a CONTRATANTE deverá notificar a CONTRATADA da referida rescisão com 30 (trinta) dias de antecedência, estando responsável pelo pagamento das entregas já realizadas.

Obs: Para os produtos de entrega única com pagamento parcelado, caso a CONTRATANTE rescinda o presente contrato deverá realizar a quitação das parcelas vincendas ou dar continuidade ao pagamento, uma vez que, o produto contratado foi entregue integralmente.

c) Havendo falta de pagamento de quaisquer parcelas, por mais de 30 (trinta) dias, este será automaticamente rescindido, com a multa estipulada.

d) Todos os boletos gerados estão sujeitos a protesto, a partir do quinto dia útil de atraso;

e) Em caso de cancelamentos, a CONTRATANTE deverá solicitar no prazo de 30 (trinta) dias antes da sua rescisão;

CLÁUSULA OITAVA - DA LEI GERAL DE PROTEÇÃO DE DADOS, SIGILO E CONFIDENCIALIDADE

A CONTRATADA, por si e por seus colaboradores, obriga-se a atuar no presente contrato em conformidade com a Legislação vigente sobre Proteção de Dados Pessoais e as determinações de órgãos reguladores/fiscalizadores sobre a matéria, em especial a Lei 13.709/2018. No manuseio dos dados a CONTRATADA deverá:

a) Tratar os dados pessoais a que tiver acesso apenas de acordo com as instruções do CONTRATANTE e em conformidade com estas cláusulas.

b) Manter e utilizar medidas de segurança administrativas, técnicas e físicas apropriadas e suficientes para proteger a confidencialidade e integridade de todos os dados pessoais.

c) Acessar os dados dentro de seu escopo e na medida abrangida por sua permissão de acesso.

d) Garantir, por si própria ou quaisquer de seus empregados, prepostos, sócios, diretores, representantes ou terceiros contratados, a confidencialidade dos dados processados.

2. Os dados pessoais não poderão ser revelados a terceiros, com exceção da prévia autorização por escrito do CONTRATANTE.

2.1 Caso a CONTRATADA seja obrigada por determinação legal a fornecer dados pessoais a uma autoridade pública, deverá informar previamente ao CONTRATANTE.

2.3 A CONTRATADA deverá notificar o CONTRATANTE em até 24 (vinte e quatro) horas a respeito de qualquer não cumprimento das disposições legais relativas à proteção de Dados Pessoais ou qualquer outra violação de segurança no âmbito das atividades e responsabilidades da CONTRATADA.

O contratante autoriza desde já a utilização dos materiais produzidos pela contratada nas redes sociais, sites e anúncios da empresa NOEXCUSE MARKETING DIGITAL.

CLÁUSULA NONA – DO FORO

Fica estabelecido o Foro de Maringá, Estado do Paraná, para dirimir qualquer questão oriunda deste contrato.

E por assim estarem certas, justas e contratadas, as partes firmam o presente instrumento em 3 (três) vias de igual teor e forma, na presença de 2 (duas) testemunhas, que abaixo assinam, a fim de que produza seus jurídicos e legais efeitos.

Maringá, {{data_assinatura}}.

_________________________          _________________________
CONTRATANTE                        CONTRATADA
{{contratante_razao_social}}       NOEXCUSE MARKETING DIGITAL
CNPJ: {{contratante_cnpj}}        CNPJ: 34.638.745/0001-00

TESTEMUNHA 1:                      TESTEMUNHA 2:
CPF:                               CPF:`;

export const DEFAULT_CONTRACT_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Contrato de Franquia Empresarial",
    template_type: "franquia",
    description: "Modelo padrão de contrato de franquia NOEXCUSE Marketing Digital com todas as cláusulas obrigatórias.",
    content: FRANCHISE_CONTENT,
    placeholders: FRANCHISE_PLACEHOLDERS,
  },
  {
    name: "Contrato de Prestação de Serviço",
    template_type: "assessoria",
    description: "Modelo padrão de contrato de prestação de serviço para clientes da rede NOEXCUSE.",
    content: SERVICE_CONTENT,
    placeholders: SERVICE_PLACEHOLDERS,
  },
];

export function getPlaceholdersForType(type: string): DefaultTemplate["placeholders"] {
  const tmpl = DEFAULT_CONTRACT_TEMPLATES.find(t => t.template_type === type);
  return tmpl?.placeholders ?? [];
}

export function renderPreview(content: string, placeholders: DefaultTemplate["placeholders"]): string {
  let result = content;
  for (const p of placeholders) {
    result = result.split(p.key).join(p.example);
  }
  return result;
}
