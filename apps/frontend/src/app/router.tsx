import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProjectsPage } from '../features/projects/pages/ProjectsPage';
import { ProjectDetailPage } from '../features/projects/pages/ProjectDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <ProjectsPage />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectDetailPage />,
      },
    ],
  },
]);
