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

  function leftAssocMemberAccess(exprs, rhs) {
    if (exprs.length === 0) {
      return rhs;
    } else {
      const [expr, op] = exprs.pop()
      const lhs = leftAssocMemberAccess(exprs, expr);
      return ast.MemberAccess(lhs, rhs, loc());
    }
  }

  function leftAssoc(ops, rhs, level) {
      if (ops.length === 0) {
          return rhs
      } else {
          const [lhs, op] = ops.pop()
          return ast.BinaryOp(op, leftAssoc(ops, lhs, level), rhs, level)
      }
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
  = LPAREN predicate:Predicate RPAREN !Op
    //                                ^^^
    //                                HACK: This makes sure this isn't
    //                                mistakenly consumed as a predicate if we
    //                                intended to consume it as an expression
    //                                instead
    { return predicate }

  / left:Expr op:ComparisonOp right:Expr
    { return ast.Comparison(op, left, right, loc()) }

  / Expr


Expr
  = rest:( Expr2 ( PLUS / MINUS ) )* last:Expr2
    { return leftAssoc(rest, last, 8) }


Expr2
  = rest:( Expr3 ( MULT / DIV ) )* last:Expr3
    { return leftAssoc(rest, last, 9) }


Expr3
  = LPAREN expr:Expr RPAREN
    { return expr }

  / callee:Expr4 LPAREN args:ExprList RPAREN
    { return ast.FunctionCall(callee, args) }

  / Expr4


Expr4
  = leading:( Identifier DOT )+ field:Identifier
    { return leftAssocMemberAccess(leading, field); }

  / Literal

  / Identifier


ExprList
  = first:Expr
    rest:( COMMA exprs:Expr
           { return exprs } )*
    COMMA?
    { return [first, ...rest] }


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


Op
  = ComparisonOp
  / ArithmeticOp


ComparisonOp
  = EQ / NEQ / LTE / GTE / LT / GT


ArithmeticOp
  = PLUS / MINUS / MULT / DIV


_ ""
  = Ignorable*
    { return null }


Ignorable
  = Whitespace
    { return null }

  / Comment
    { return null }


Whitespace
  = $( [ \t\r\n]+ )


Comment
  = LineComment
  / CommentBlock


LineComment
  = '//' text:$( [^\n] )* [\n]
    { return null }


CommentBlock
  = '/*' text:$( !'*/' . )* '*/'
    { return null }


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
COLON   = _ ':' _   { return ':' }
COMMA   = _ ',' _   { return ',' }
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

PLUS    = _ '+' _   { return '+' }
MINUS   = _ '-' _   { return '-' }
MULT    = _ '*' _   { return '*' }
DIV     = _ '/' _   { return '/' }
