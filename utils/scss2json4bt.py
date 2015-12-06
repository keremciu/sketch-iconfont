#!/usr/bin/env python
# coding=utf8


import re
import json

bt = {'icons': []}
fab = {'icons': []}

with open('_variables.scss', 'r') as s:
    for l in s:

        if '$bt-var' in l:
            r = re.search(r'\$bt-var-(.*): "\\(.*)";', l)
            _name = r.group(1).replace('-', ' ').title()
            _id = r.group(1)
            _unicode = r.group(2)

            bt['icons'].append({
                "name": _name,
                "id": _id,
                "unicode": _unicode,
                "created": 1,
            })

        if '$fab-var' in l:
            r = re.search(r'\$fab-var-(.*): "\\(.*)";', l)
            _name = r.group(1).replace('-', ' ').title()
            _id = r.group(1)
            _unicode = r.group(2)

            fab['icons'].append({
                "name": _name,
                "id": _id,
                "unicode": _unicode,
                "created": 1,
            })

with open('blacktie.json', 'w') as outfile:
        json.dump(bt, outfile, sort_keys=True, indent=2)

with open('fontawesomebrands.json', 'w') as outfile:
    json.dump(fab, outfile, sort_keys=True, indent=2)
