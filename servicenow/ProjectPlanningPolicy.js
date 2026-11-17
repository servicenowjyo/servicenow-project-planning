/* Independent Project Planning policy. Identical source in Node and ServiceNow. */
var ProjectPlanningPolicy = function () {};
ProjectPlanningPolicy.prototype = {
    initialize: function () {},
    _integer: function (x, label, minimum) {
        if (typeof x !== 'number' || !isFinite(x) || Math.floor(x) !== x || x < minimum || x > 1000000000000) throw new Error('Invalid ' + label);
        return x;
    },
    _date: function (s) {
        if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Invalid ISO date');
        var t = Date.parse(s + 'T00:00:00Z');
        if (!isFinite(t) || new Date(t).toISOString().slice(0, 10) !== s) throw new Error('Invalid calendar date');
        return t / 86400000;
    },
    planning: function (d) {
        var start = this._date(d.start_date), deadline = this._date(d.deadline), tasks = d.tasks;
        if (!Array.isArray(tasks) || !tasks.length || tasks.length > 100) throw new Error('Invalid task set');
        var map = {}, order = [], visiting = {}, visited = {}, self = this;
        for (var i = 0; i < tasks.length; i++) {
            var t = tasks[i];
            if (!/^[A-Z][A-Z0-9_-]*$/.test(t.id) || map[t.id]) throw new Error('Invalid or duplicate task id');
            this._integer(t.duration_days,'duration',1); this._integer(t.allocation_pct,'allocation',1);
            if (t.duration_days > 365 || t.allocation_pct > 100 || typeof t.done !== 'boolean' || !t.resource || !Array.isArray(t.depends_on)) throw new Error('Invalid task');
            map[t.id] = {source:t, es:0, ef:0, ls:0, lf:0, successors:[]};
        }
        function visit(id) {
            if (!map[id]) throw new Error('Unknown dependency ' + id);
            if (visiting[id]) throw new Error('Dependency cycle');
            if (visited[id]) return;
            visiting[id] = true;
            var n = map[id], deps = n.source.depends_on, seen = {};
            for (var j = 0; j < deps.length; j++) {
                if (seen[deps[j]]) throw new Error('Duplicate dependency');
                seen[deps[j]] = true; visit(deps[j]);
                n.es = Math.max(n.es, map[deps[j]].ef); map[deps[j]].successors.push(id);
            }
            n.ef = n.es + n.source.duration_days; visiting[id] = false; visited[id] = true; order.push(id);
        }
        for (i = 0; i < tasks.length; i++) visit(tasks[i].id);
        var finish = 0;
        for (i = 0; i < order.length; i++) finish = Math.max(finish, map[order[i]].ef);
        for (i = order.length-1; i >= 0; i--) {
            var n = map[order[i]]; n.lf = finish;
            for (var j = 0; j < n.successors.length; j++) n.lf = Math.min(n.lf,map[n.successors[j]].ls);
            n.ls = n.lf-n.source.duration_days;
        }
        var schedule = [], critical = [], ready = [], loads = {}, conflicts = [];
        for (i = 0; i < tasks.length; i++) {
            var node = map[tasks[i].id], src = node.source, totalFloat = node.ls-node.es, depsDone = true;
            for (j = 0; j < src.depends_on.length; j++) if (!map[src.depends_on[j]].source.done) depsDone = false;
            if (src.done && !depsDone) throw new Error('Completed task has incomplete predecessor');
            if (!src.done && depsDone) ready.push(src.id);
            if (totalFloat === 0) critical.push(src.id);
            schedule.push({id:src.id, es:node.es, ef:node.ef, ls:node.ls, lf:node.lf, float_days:totalFloat});
            for (var day = node.es; day < node.ef; day++) {
                var key = src.resource+'|'+day; loads[key] = (loads[key] || 0)+src.allocation_pct;
            }
        }
        var loadKeys = Object.keys(loads).sort();
        for (i = 0; i < loadKeys.length; i++) if (loads[loadKeys[i]] > 100) {
            var parts = loadKeys[i].split('|'); conflicts.push({resource:parts[0],day_offset:Number(parts[1]),allocation_pct:loads[loadKeys[i]]});
        }
        critical.sort(); ready.sort(); schedule.sort(function(a,b){return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;});
        return {id:d.id, duration_days:finish, finish_date:new Date((start+finish)*86400000).toISOString().slice(0,10),
            deadline_slip_days:Math.max(0,start+finish-(deadline+1)), critical_task_ids:critical, ready_task_ids:ready,
            overloaded_resource_days:conflicts.length, conflicts:conflicts, schedule:schedule};
    },
    type:'ProjectPlanningPolicy'
};
if(typeof module !== 'undefined' && module.exports) module.exports=ProjectPlanningPolicy;
