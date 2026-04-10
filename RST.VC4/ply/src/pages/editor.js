// Editor page for routing integration
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '../components/editor';

export default function EditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  // This page mounts the Editor module as a standalone route
  return <Editor websiteId={id} navigate={navigate} />;
}
