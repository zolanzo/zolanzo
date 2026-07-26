"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MetricCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { Users } from "lucide-react";

export function DesignSystemSamples() {
  return (
    <div className="space-y-10">
      <section id="components">
        <h2 className="text-h2 mb-6">Components</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-h3 mb-3">Button</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="gold">Gold</Button>
            </div>
          </div>

          <div>
            <h3 className="text-h3 mb-3">Badge</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          <div>
            <h3 className="text-h3 mb-3">Alert</h3>
            <div className="space-y-3">
              <Alert variant="primary" title="Design tokens loaded">
                CSS variables mirror the TypeScript token constants.
              </Alert>
              <Alert variant="success" title="Components ready">
                UI primitives compose into layout shells and page templates.
              </Alert>
            </div>
          </div>

          <div>
            <h3 className="text-h3 mb-3">Input</h3>
            <Input
              label="Workspace name"
              name="workspace"
              placeholder="Acme Operations"
              hint="Used in dashboard headers and exports."
            />
          </div>

          <div>
            <h3 className="text-h3 mb-3">Card</h3>
            <Card>
              <CardHeader>
                <CardTitle>Surface card</CardTitle>
                <CardDescription>
                  Rounded container with soft shadow and border token.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div>
            <h3 className="text-h3 mb-3">MetricCard</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                label="Active contributors"
                value="1,248"
                delta={8.2}
                icon={<Users className="size-5" aria-hidden />}
              />
              <MetricCard
                label="Tasks completed"
                value="32.4k"
                delta={-2.1}
              />
            </div>
          </div>

          <div>
            <h3 className="text-h3 mb-3">Tabs</h3>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                <TabsTrigger value="layouts">Layouts</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <p className="text-small text-muted-foreground">
                  Scannable documentation with live samples.
                </p>
              </TabsContent>
              <TabsContent value="tokens">
                <p className="text-small text-muted-foreground">
                  Colors, spacing, radius, and typography scales.
                </p>
              </TabsContent>
              <TabsContent value="layouts">
                <p className="text-small text-muted-foreground">
                  Dashboard, docs, auth, and marketing shells.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
