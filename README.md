# act-execution-to-knack

Apify act for inserting crawler results into Knack database.

This act fetches all results from a specified Apifier crawler execution and inserts them into
a view in Knack database.

**INPUT**

Input is a JSON object with the following properties:

```javascript
{ 
    // crawler execution id
    "_id": EXECUTION_ID,
    
    // knack connection credentials
    "data": {
        "view": KNACK_VIEW,
        "scene": KNACK_SCENE,
        "appId": KNACK_APP_ID,
        "apiKey": KNACK_API_KEY
    }
}
```

__The act can be run with a crawler finish webhook, in such case fill just the contents of data 
attribute into a crawler finish webhook data.__
