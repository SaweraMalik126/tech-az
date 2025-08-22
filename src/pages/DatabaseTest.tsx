import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { runAllTests } from '../test-database-connection';

const DatabaseTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      const testResults = await runAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Database Connection Test</h1>
          <p className="text-muted-foreground">
            Test your Supabase database connection and identify any issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRunTests} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>💡 Open your browser console (F12) to see detailed test results</p>
              <p>🔍 Tests will check: Connection, Authentication, Table Access, RLS, Schema, and more</p>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Badge variant={results.basicConnection ? 'default' : 'destructive'}>
                    {results.basicConnection ? 'PASS' : 'FAIL'}
                  </Badge>
                  <p className="text-sm mt-1">Connection</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={results.authentication ? 'default' : 'destructive'}>
                    {results.authentication ? 'PASS' : 'FAIL'}
                  </Badge>
                  <p className="text-sm mt-1">Authentication</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={results.tableAccess ? 'default' : 'destructive'}>
                    {results.tableAccess ? 'PASS' : 'FAIL'}
                  </Badge>
                  <p className="text-sm mt-1">Table Access</p>
                </div>
                
                <div className="text-center">
                  <Badge variant={results.schema ? 'default' : 'destructive'}>
                    {results.schema ? 'PASS' : 'FAIL'}
                  </Badge>
                  <p className="text-sm mt-1">Schema</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Quick Fixes for Common Issues:</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Connection Failed:</strong> Check Supabase URL and API key</li>
                  <li>• <strong>Authentication Failed:</strong> Verify user login or RLS policies</li>
                  <li>• <strong>Table Access Failed:</strong> Check table names and permissions</li>
                  <li>• <strong>Schema Mismatch:</strong> Verify database schema matches TypeScript types</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Run the Tests</h4>
              <p className="text-sm text-muted-foreground">
                Click the "Run All Tests" button above to execute all database connection tests.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">2. Check Console Output</h4>
              <p className="text-sm text-muted-foreground">
                Open browser console (F12) to see detailed test results and error messages.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">3. Review Results</h4>
              <p className="text-sm text-muted-foreground">
                The summary above shows which tests passed or failed.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">4. Fix Issues</h4>
              <p className="text-sm text-muted-foreground">
                Use the console output to identify and resolve any connection issues.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatabaseTest;
