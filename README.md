ADVPLayC
========
Utilitário para compilação pela linha de comando. Esse pacote não possui o 
compilador, o compilador é baixado do projeto do 
[advpl-vscode](https://github.com/killerall/advpl-vscode)


Como instalar
=============

Pelo NPM:

```
$ npm install -g advplc
```

Pelo github:

```
$ git clone https://github.com/danielflira/advplc
$ cd advplc
$ npm install -g
```


Como configurar
===============

É necessário configurar as opções globais com o parametro --cfg e adicionar os 
ambientes com a opção --add (as duas podem ser utilizadas em conjunto)

```
$ advplc --cfg .
$ advplc --add .

ou

$ advplc --cfg --add .
```

No comando --add caso seja colocar um nome de ambiente já existente
(respeitando maiúsculas e minúsculas) será atualiza as informações deste 
ambiente


Como utilizar
=============

Para utilizar dentro do diretório que possui o arquivo de configuração .advplc 
apenas digitar o comando informando o nome do ambiente:

```
$ advplc --env Protheus118 foobar.prw

ou

$ advplc --env Protheus12117 fontes/
```
