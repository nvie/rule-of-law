[![Build Status](https://github.com/nvie/rule-of-law/workflows/test/badge.svg)](https://github.com/nvie/rule-of-law/actions)

# Rule of Law

Rule of Law is a logical predicate language and a tool that allows you to
verify assumptions about data and relationships in your database that are
otherwise hard to check or enforce.

Think of Rule of Law as a last line of defense, to provide a safety-net for
cases that normal database constaints cannot cover.


## Example

Here's an example:

```
rule "All completed orders must have a completion date"
forall Order o:
  o.status = "COMPLETE" => o.date_completed != NULL
```

Read the above as "for every order in the DB it should hold that _if_ its
status is COMPLETE, _then_ it must also have a completion date".  Note that
this expression says nothing about non-COMPLETE orders.

One could also state the opposite: "for every order in the DB it should hold
that _if_ it has a completion date, _then_ it must also be in COMPLETE status":

```
rule "All orders with a completion date must be complete"
forall Order o:
  o.date_completed != NULL => o.status = "COMPLETE"
```

Since this arrow holds both ways, these two rules can be combined into a single
rule with an equivalence relation:

```
rule "All completed orders have a completion date, and all others do not"
forall Order o:
  o.date_completed != NULL <=> o.status = "COMPLETE"
```


## Multi-table relationships

Other examples that are notoriously hard to capture with constraints are
cross-table rules.  Oftentimes in practice it's very useful to denormalize your
data to have all data conveniently available on tables where you need them,
even though it means having multiple sources of truth, with the risk of those
getting out of sync.

Here's an example that ensures this will not happen:

```
rule "All order's prescriptions belong to the same user"
forall Order o:
  o.prescription != NULL => o.prescription.user = o.user
```


## Rationale

Codifying these rules as logical statements serves multiple purposes:

1. Share common system knowledge.  By making the rules explicit, they become an
   expression of intent.
2. Explicit documentation.
3. One place to look.  Since all rules can be stored in the same place, it's
   easy to find.
4. Proactive monitoring.  Since these rules are self-validating, we can
   periodically run them as checks against real production data and alert as
   soon as a counterexample is found.
5. Test cases.  By running the rules as part of the CI / testing phase, you can
   catch broken assumptions as they happen.
6. Guide code reviews.  Because the rules are explicitly stored and versioned
   alongside code, they allow us to link to a rule when reviewing code.
7. Part of the developer workflow.  While working on new code, formulate
   a one-off rule and verify it quickly against real data.

