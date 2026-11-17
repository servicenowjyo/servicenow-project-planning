/* Admin-only custom project application. No approvals, messages or payments are sent. */
var ProjectPlanningService = Class.create();
ProjectPlanningService.prototype = {
    initialize: function () {},
    tables: {"planning":"u_ppc_planning"},
    review: function (record, kind) {
        if (!gs.hasRole('admin')) throw new Error('Admin role required');
        if (!this.tables[kind] || record.getTableName() !== this.tables[kind]) throw new Error('Wrong record type');
        var input = {id:record.getValue('u_key')}, i, fields;
        if (kind === 'finance') {
            fields=['budget_paise','actual_paise','etc_paise','remaining_commitments_paise','earned_value_paise','planned_value_paise'];
            for(i=0;i<fields.length;i++) {var value=record.getValue('u_'+fields[i]);if(value === null || value === '') throw new Error('Required: '+fields[i]);input[fields[i]]=Number(value);}
        } else if (kind === 'governance') {
            fields=['as_of','evidence_date','decision_due','owner','sponsor_approval'];
            for(i=0;i<fields.length;i++) input[fields[i]]=record.getValue('u_'+fields[i]) || '';
            input.likelihood=Number(record.getValue('u_likelihood')); input.impact=Number(record.getValue('u_impact'));
            input.business_case_complete=record.getValue('u_business_case_complete') === '1';
            input.risk_response_agreed=record.getValue('u_risk_response_agreed') === '1';
        } else {
            input.start_date=record.getValue('u_start_date'); input.deadline=record.getValue('u_deadline');
            input.tasks=JSON.parse(record.getValue('u_tasks'));
        }
        var result = new ProjectPlanningPolicy()[kind](input);
        record.setValue('u_input',JSON.stringify(input));
        record.setValue('u_result',JSON.stringify(result));
        record.setValue('u_status',kind === 'finance' ? result.status : kind === 'governance' ? result.gate_decision : result.deadline_slip_days || result.overloaded_resource_days ? 'REVIEW' : 'ON_TRACK');
        record.setValue('u_advice',kind === 'planning' ? 'Critical: '+result.critical_task_ids.join(', ')+' | Ready: '+result.ready_task_ids.join(', ')+' | Overloaded resource-days: '+result.overloaded_resource_days : result.actions.join(' | ') || 'No review flags');
        record.setValue('u_reviewed_at',gs.nowDateTime());
        if (!record.update()) throw new Error('Review write failed');
        return result;
    },
    reviewAll: function () {
        if (!gs.hasRole('admin')) throw new Error('Admin role required');
        var counts = {}, errors = [];
        for (var kind in this.tables) {
            counts[kind] = 0;
            var gr = new GlideRecord(this.tables[kind]);
            if (!gr.isValid() || !gr.isValidField('u_key')) throw new Error('Schema missing');
            gr.addQuery('u_key','STARTSWITH','PPC-'); gr.query();
            while (gr.next()) {
                try { this.review(gr,kind); counts[kind]++; }
                catch (e) { errors.push(gr.getValue('u_key')+': '+e.message); }
            }
        }
        if (errors.length) throw new Error(errors.join('; '));
        return counts;
    },
    type:'ProjectPlanningService'
};
