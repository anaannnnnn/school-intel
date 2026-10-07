import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@school-intel/ui';
import { staff, useDb, useSession } from '@school-intel/api';
import type { Actor } from '@school-intel/contracts';
import { Layout } from './Layout';
import { Restricted } from './ui';
import { SignIn } from './screens/SignIn';
import { Overview } from './screens/Overview';
import { Copilot } from './screens/Copilot';
import { DraftReview } from './screens/DraftReview';
import { SupportQueue } from './screens/SupportQueue';
import { SupportCaseScreen } from './screens/SupportCase';
import { RequestsInbox } from './screens/RequestsInbox';
import { RequestScreen } from './screens/RequestScreen';
import { Students } from './screens/Students';
import { StudentProfile } from './screens/StudentProfile';
import { Homework } from './screens/Homework';
import { Behaviour } from './screens/Behaviour';
import { Safeguarding } from './screens/Safeguarding';
import { SafeguardingCase } from './screens/SafeguardingCase';
import { Attendance } from './screens/Attendance';
import { Passport } from './screens/Passport';
import { Exams } from './screens/Exams';
import { Activities } from './screens/Activities';
import { Leadership } from './screens/Leadership';
import { Integrations } from './screens/Integrations';
import { AuditLog } from './screens/AuditLog';
import { Lessons } from './screens/Lessons';
import { RegisterScreen } from './screens/Register';
import { Materials } from './screens/Materials';
import { MaterialEditor } from './screens/MaterialEditor';
import { Questions } from './screens/Questions';
import { Assessments } from './screens/Assessments';
import { AssessmentBuilder } from './screens/AssessmentBuilder';
import { AssessmentDetail } from './screens/AssessmentDetail';
import { Marking } from './screens/Marking';
import { MarkItem } from './screens/MarkItem';
import { Doubts } from './screens/Doubts';
import { DoubtThread } from './screens/DoubtThread';
import { Gradebook } from './screens/Gradebook';
import { Discipline } from './screens/Discipline';

function Guard({ actor, area, children }: { actor: Actor; area: string; children: ReactNode }) {
  const allowed = staff.canAccessArea(actor, area);
  useEffect(() => {
    if (!allowed) staff.recordDenied(actor, area);
  }, [allowed, actor, area]);
  if (!allowed) return <Restricted />;
  return <>{children}</>;
}

export function App() {
  const actor = useSession('staff');
  useDb();
  const valid = actor?.kind === 'staff';

  return (
    <ToastProvider>
      <HashRouter>
        {!valid ? (
          <Routes>
            <Route path="*" element={<SignIn />} />
          </Routes>
        ) : (
          <Routes>
            <Route element={<Layout actor={actor} />}>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview actor={actor} />} />
              <Route path="/copilot" element={<Guard actor={actor} area="copilot"><Copilot actor={actor} /></Guard>} />
              <Route path="/copilot/:id" element={<Guard actor={actor} area="copilot"><DraftReview actor={actor} /></Guard>} />
              <Route path="/support" element={<Guard actor={actor} area="support"><SupportQueue actor={actor} /></Guard>} />
              <Route path="/support/:id" element={<Guard actor={actor} area="support"><SupportCaseScreen actor={actor} /></Guard>} />
              <Route path="/requests" element={<Guard actor={actor} area="requests"><RequestsInbox actor={actor} /></Guard>} />
              <Route path="/requests/:id" element={<Guard actor={actor} area="requests"><RequestScreen actor={actor} /></Guard>} />
              <Route path="/students" element={<Guard actor={actor} area="students"><Students actor={actor} /></Guard>} />
              <Route path="/students/:id" element={<Guard actor={actor} area="students"><StudentProfile actor={actor} /></Guard>} />
              <Route path="/homework" element={<Guard actor={actor} area="homework"><Homework actor={actor} /></Guard>} />
              <Route path="/behaviour" element={<Guard actor={actor} area="behaviour"><Behaviour actor={actor} /></Guard>} />
              <Route path="/safeguarding" element={<Guard actor={actor} area="safeguarding"><Safeguarding actor={actor} /></Guard>} />
              <Route path="/safeguarding/:id" element={<Guard actor={actor} area="safeguarding"><SafeguardingCase actor={actor} /></Guard>} />
              <Route path="/attendance" element={<Guard actor={actor} area="attendance"><Attendance actor={actor} /></Guard>} />
              <Route path="/passport" element={<Guard actor={actor} area="passport"><Passport actor={actor} /></Guard>} />
              <Route path="/exams" element={<Guard actor={actor} area="exams"><Exams actor={actor} /></Guard>} />
              <Route path="/activities" element={<Guard actor={actor} area="activities"><Activities actor={actor} /></Guard>} />
              <Route path="/leadership" element={<Guard actor={actor} area="leadership"><Leadership actor={actor} /></Guard>} />
              <Route path="/integrations" element={<Guard actor={actor} area="integrations"><Integrations actor={actor} /></Guard>} />
              <Route path="/audit" element={<Guard actor={actor} area="audit"><AuditLog actor={actor} /></Guard>} />
              <Route path="/lessons" element={<Guard actor={actor} area="lessons"><Lessons actor={actor} /></Guard>} />
              <Route path="/lessons/:id" element={<Guard actor={actor} area="lessons"><RegisterScreen actor={actor} /></Guard>} />
              <Route path="/materials" element={<Guard actor={actor} area="materials"><Materials actor={actor} /></Guard>} />
              <Route path="/materials/:id" element={<Guard actor={actor} area="materials"><MaterialEditor actor={actor} /></Guard>} />
              <Route path="/questions" element={<Guard actor={actor} area="questions"><Questions actor={actor} /></Guard>} />
              <Route path="/assessments" element={<Guard actor={actor} area="assessments"><Assessments actor={actor} /></Guard>} />
              <Route path="/assessments/new" element={<Guard actor={actor} area="assessments"><AssessmentBuilder actor={actor} /></Guard>} />
              <Route path="/assessments/:id" element={<Guard actor={actor} area="assessments"><AssessmentDetail actor={actor} /></Guard>} />
              <Route path="/marking" element={<Guard actor={actor} area="marking"><Marking actor={actor} /></Guard>} />
              <Route path="/marking/:key" element={<Guard actor={actor} area="marking"><MarkItem actor={actor} /></Guard>} />
              <Route path="/doubts" element={<Guard actor={actor} area="doubts"><Doubts actor={actor} /></Guard>} />
              <Route path="/doubts/:id" element={<Guard actor={actor} area="doubts"><DoubtThread actor={actor} /></Guard>} />
              <Route path="/gradebook" element={<Guard actor={actor} area="gradebook"><Gradebook actor={actor} /></Guard>} />
              <Route path="/discipline" element={<Guard actor={actor} area="discipline"><Discipline actor={actor} /></Guard>} />
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Routes>
        )}
      </HashRouter>
    </ToastProvider>
  );
}
