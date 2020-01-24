{
  const {
    StringLiteral,
  } = require('../ast');
}


start =
  RULE ' ' StringLiteral


StringLiteral
  = rawValue:$( ["] ( ([\\].) / [^"\n] )* ["] )
    {
      const value = unescape(rawValue
        .substring(1, rawValue.length - 1))  // strip off quotes
      return StringLiteral(value)
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
// FORALL = _ 'forall'  EOK


EOK "end of keyword"
  = ![a-zA-Z0-9_] _
