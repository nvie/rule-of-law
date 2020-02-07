{
  const ast = require('../ast').default;

  function unescape(s) {
      return s
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
  }

  function loc() {
      return options.noLocation ? undefined : location()
  }
}


Document
  = rules:Rule*
    { return ast.Document(rules, loc()) }


Rule
  = skip:SKIP? RULE name:StringLiteral predicate:Predicate _
    { return ast.Rule(name.value, predicate, { skip: skip !== null }, loc()) }


Identifier "identifier"
  = name:$( [A-Za-z_][A-Za-z0-9_]* )
    { return ast.Identifier(name, loc()) }


Predicate
  = FORALL set:Identifier _ variable:Identifier COLON predicate:Predicate
    { return ast.ForAll(set, variable, predicate, loc()) }

  / EXISTS set:Identifier _ variable:Identifier COLON predicate:Predicate
    { return ast.Exists(set, variable, predicate, loc()) }

  / Pred2


Pred2
  = /* p <=> q <=> r (right associative) */
    /* p <=> (q <=> r) */
    left:Pred3 EQUIV right:Pred2
    { return ast.Equivalence(left, right, loc()) }

  / Pred3


Pred3
  = left:Pred4 IMPLIES right:Pred3
    { return ast.Implication( left, right, loc()) }

  / Pred4


Pred4
  = leading:( pred:Pred5 OR
              { return pred } )+ last:Pred5
    { return ast.OR([...leading, last], loc()) }

  / Pred5


Pred5
  = leading:( pred:Pred6 AND
              { return pred } )+ last:Pred6
    { return ast.AND([...leading, last], loc()) }

  / Pred6


Pred6
  = NOT predicate:Pred7
    { return ast.NOT(predicate, loc()) }

  / Pred7


Pred7
  = LPAREN predicate:Predicate RPAREN
    { return predicate }

  / left:Expr op:( EQ / NEQ / LTE / GTE / LT / GT ) right:Expr
    { return ast.Comparison(op, left, right, loc()) }

  / Expr


Expr
  = leading:( Identifier ( DOT / ARROW ) )+ field:Identifier
    {
       function leftAssoc(exprs, rhs) {
         if (exprs.length === 0) {
           return rhs;
         } else {
           const [expr, op] = exprs.pop()
           const lhs = leftAssoc(exprs, expr);
           if (op === '.') {
             return ast.FieldSelection(lhs, rhs, loc());
           } else if (op === '->') {
             return ast.RelationSelection(lhs, rhs, loc());
           } else {
             throw new Error('Unknown operation: ' + op);
           }
         }
       }

       return leftAssoc(leading, field);
    }

  / Literal

  / Identifier


Literal "literal value"
  = NULL
    { return ast.NullLiteral(loc()) }
  / BoolLiteral
  / NumberLiteral
  / StringLiteral


BoolLiteral
  = TRUE
    { return ast.BoolLiteral(true, loc()) }

  / FALSE
    { return ast.BoolLiteral(false, loc()) }


NumberLiteral
  = value:$( [-]?[0-9]+([.][0-9]*)? )
    { return ast.NumberLiteral(parseFloat(value), loc()) }


StringLiteral
  = rawValue:$( ["] ( ([\\].) / [^"\n] )* ["] )
    {
      const value = unescape(rawValue
        .substring(1, rawValue.length - 1))  // strip off quotes
      return ast.StringLiteral(value, loc())
    }


_ ""
  = Ignorable*
    { return null }


Ignorable
  // TODO Eventually support comments here too?
  = Whitespace
    { return null }


Whitespace
  = $( [ \t\r\n]+ )


//
// Keywords
//
RULE   = _ 'rule'    EOK
FORALL = _ 'forall'  EOK
EXISTS = _ 'exists'  EOK
OR     = _ 'or'      EOK
AND    = _ 'and'     EOK
NOT    = _ 'not'     EOK
NULL   = _ 'null'i   EOK
TRUE   = _ 'true'    EOK
FALSE  = _ 'false'   EOK
SKIP   = _ 'skip'    EOK


EOK "end of keyword"
  = ![a-zA-Z0-9_] _


//
// Punctuation
//
ARROW   = _ '->' _  { return '->' }
COLON   = _ ':' _   { return ':' }
DOT     = _ '.' _   { return '.' }
EQ      = _ '=' _   { return '=' }
EQUIV   = _ '<=>' _ { return '<=>' }
GT      = _ '>' _   { return '>' }
GTE     = _ '>=' _  { return '>=' }
IMPLIES = _ '=>' _  { return '=>' }
LPAREN  = _ '(' _   { return '(' }
LT      = _ '<' _   { return '<' }
LTE     = _ '<=' _  { return '<=' }
NEQ     = _ '!=' _  { return '!=' }
RPAREN  = _ ')' _   { return ')' }
