import { useEffect, useLayoutEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@school-intel/ui';
import { family, useDb, useSession } from '@school-intel/api';
import { FamilyProvider } from './family-context';
import { Shell } from './Shell';
import { ParentToday } from './screens/ParentToday';
import { StudentToday } from './screens/StudentToday';
import { Children } from './screens/Children';
import { Learning } from './screens/Learning';
import { Tasks } from './screens/Tasks';
import { AssignmentScreen } from './screens/Assignment';
import { Concierge } from './screens/Concierge';
import { Requests } from './screens/Requests';
import { EarlyCollection } from './screens/EarlyCollection';
import { RequestDetail } from './screens/RequestDetail';
import { Help } from './screens/Help';
import { HelpForm } from './screens/HelpForm';
import { HelpStatus } from './screens/HelpStatus';
import { Activities } from './screens/Activities';
import { Bus } from './screens/Bus';
import { Settings } from './screens/Settings';
import { More } from './screens/More';
import { Notifications } from './screens/Notifications';
import { Learn } from './screens/Learn';
import { SubjectScreen } from './screens/SubjectScreen';
import { MaterialScreen } from './screens/MaterialScreen';
import { StudyHelper } from './screens/StudyHelper';
import { DoubtThread } from './screens/DoubtThread';
import { Me } from './screens/Me';
import { Tests } from './screens/Tests';
import { Player } from './screens/Player';
import { Result } from './screens/Result';
import { WrittenTask } from './screens/WrittenTask';
import { AttendanceScreen } from './screens/AttendanceScreen';
import { Grades } from './screens/Grades';
import { BehaviourScreen } from './screens/BehaviourScreen';
import { Timetable } from './screens/Timetable';
import { Progress } from './screens/Progress';

export function App() {
  const actor = useSession('family');
  useDb();
  const prefs = actor ? family.preferences(actor) : undefined;

  useLayoutEffect(() => {
    if (actor) document.documentElement.dataset.role = actor.kind === 'guardian' ? 'parent' : 'student';
  }, [actor]);

  useEffect(() => {
    const ar = prefs?.language === 'ar';
    document.documentElement.lang = ar ? 'ar' : 'en';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [prefs?.language]);

  return (
    <ToastProvider>
      <HashRouter>
        {!actor ? null : (
          <FamilyProvider actor={actor}>
            <Routes>
              <Route element={<Shell />}>
                <Route index element={<Navigate to="/today" replace />} />
                <Route path="/today" element={actor.kind === 'guardian' ? <ParentToday /> : <StudentToday />} />
                <Route path="/children" element={<Children />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:id" element={<AssignmentScreen />} />
                <Route path="/ask" element={actor.kind === 'student' ? <StudyHelper /> : <Concierge />} />
                <Route path="/ask/:id" element={<DoubtThread />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/learn/:subjectId" element={<SubjectScreen />} />
                <Route path="/material/:id" element={<MaterialScreen />} />
                <Route path="/tests" element={<Tests />} />
                <Route path="/tests/play/:attemptId" element={<Player />} />
                <Route path="/tests/result/:attemptId" element={<Result />} />
                <Route path="/written/:id" element={<WrittenTask />} />
                <Route path="/me" element={<Me />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/attendance" element={<AttendanceScreen />} />
                <Route path="/grades" element={<Grades />} />
                <Route path="/behaviour" element={<BehaviourScreen />} />
                <Route path="/timetable" element={<Timetable />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/requests/new/early-collection" element={<EarlyCollection />} />
                <Route path="/requests/:id" element={<RequestDetail />} />
                <Route path="/help" element={<Help />} />
                <Route path="/help/new" element={<HelpForm />} />
                <Route path="/help/:id" element={<HelpStatus />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/bus" element={<Bus />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/more" element={<More />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<Navigate to="/today" replace />} />
              </Route>
            </Routes>
          </FamilyProvider>
        )}
      </HashRouter>
    </ToastProvider>
  );
}
