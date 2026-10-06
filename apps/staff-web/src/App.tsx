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
              <Route path="*" element={<Navigate to="/overview" replace />} />
            </Route>
          </Routes>
        )}
      </HashRouter>
    </ToastProvider>
  );
}
