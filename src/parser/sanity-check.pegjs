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
}


Document
  = rules:Rule*
    { return ast.Document(rules, location()) }


Rule
  = RULE name:StringLiteral predicate:Predicate
    { return ast.Rule(name.value, predicate, location()) }


Identifier "identifier"
  = name:$( [A-Za-z_][A-Za-z0-9_]* ) _
    { return ast.Identifier(name, location()) }


Predicate
  = FORALL set:Identifier variable:Identifier COLON predicate:Predicate
    { return ast.ForAll(set, variable, predicate, location()) }

  / EXISTS set:Identifier variable:Identifier COLON predicate:Predicate
    { return ast.Exists(set, variable, predicate, location()) }

  / Pred2


Pred2
  = /* p <=> q <=> r (right associative) */
    /* p <=> (q <=> r) */
    left:Pred3 EQUIV right:Pred2
    { return ast.Equivalence(left, right, location()) }

  / Pred3


Pred3
  = left:Pred4 IMPLIES right:Pred3
    { return ast.Implication( left, right, location()) }

  / Pred4


Pred4
  = leading:( pred:Pred5 OR
              { return pred } )+ last:Pred5
    { return ast.OR([...leading, last], location()) }

  / Pred5


Pred5
  = leading:( pred:Pred6 AND
              { return pred } )+ last:Pred6
    { return ast.AND([...leading, last], location()) }

  / Pred6


Pred6
  = NOT predicate:Pred7
    { return ast.NOT(predicate, location()) }

  / Pred7


Pred7
  = LPAREN predicate:Predicate RPAREN
    { return predicate }

  / left:Expr op:( EQ / NEQ / LTE / GTE / LT / GT ) right:Expr
    { return ast.Comparison(op, left, right, location()) }

  / Expr


Expr
  = leading:( Identifier ( DOT / ARROW ) )+ field:Identifier
    {
       const loc = location()

       function leftAssoc(exprs, rhs) {
         if (exprs.length === 0) {
           return rhs;
         } else {
           const [expr, op] = exprs.pop()
           const lhs = leftAssoc(exprs, expr);
           if (op === '.') {
             return ast.FieldSelection(lhs, rhs, loc);
           } else if (op === '->') {
             return ast.RelationSelection(lhs, rhs, loc);
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
    { return ast.NullLiteral(location()) }
  / BoolLiteral
  / NumberLiteral
  / StringLiteral


BoolLiteral
  = TRUE
    { return ast.BoolLiteral(true, location()) }

  / FALSE
    { return ast.BoolLiteral(false, location()) }


NumberLiteral
  = value:$( [-]?[0-9]+([.][0-9]*)? ) _
    { return ast.NumberLiteral(parseFloat(value), location()) }


StringLiteral
  = rawValue:$( ["] ( ([\\].) / [^"\n] )* ["] ) _
    {
      const value = unescape(rawValue
        .substring(1, rawValue.length - 1))  // strip off quotes
      return ast.StringLiteral(value, location())
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
