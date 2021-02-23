interface DependencyNode {
    id: string;
    group: number;
}

interface DependencyLink {
    source: string;
    target: string;
    value: number;
}

interface Dependency {
    version: string;
    dependencies: { [name: string]: Dependency };
    requires: { [name: string]: string };
}

interface DependencyRoot extends Dependency {
    name: string;
}

interface PackageRoot {
    dependencies: { [name: string]: string };
    devDependencies: { [name: string]: string };
    name: string;
}

export class DependenciesParser {

    public static parse(packageRoot: PackageRoot, dependencyRoot: DependencyRoot): { nodes: DependencyNode[], links: DependencyLink[] } {
        const result: { nodes: DependencyNode[], links: DependencyLink[] } = { nodes: [], links: [] };
        result.nodes.push({ id: packageRoot.name, group: 1 });

        for (const name in packageRoot.dependencies) {
            result.nodes.push({ id: name, group: 2 });
            result.links.push({ source: packageRoot.name, target: name, value: 1 });
        }

        for (const name in packageRoot.devDependencies) {
            result.nodes.push({ id: name, group: 2 });
            result.links.push({ source: packageRoot.name, target: name, value: 1 });
        }

        for (const name in dependencyRoot.dependencies) {
            this.processDependency(name, dependencyRoot.dependencies[name], result, 3, dependencyRoot);
        }

        return result;
    }

    private static processDependency(name: string, dependency: Dependency, graph: { nodes: DependencyNode[], links: DependencyLink[] }, depth: number, dependencyRoot: DependencyRoot): void {
        if (graph.nodes.findIndex(dep => dep.id === name) === -1) {
            graph.nodes.push({ id: name, group: depth });
        }

        for (const dep in dependency.dependencies) {
            if (graph.links.findIndex(link => link.source === name && link.target === dep) === -1) {
                graph.links.push({ source: name, target: dep, value: 1 });
                this.processDependency(dep, dependency.dependencies[dep], graph, depth + 1, dependencyRoot);
            }
        }

        for (const dep in dependency.requires) {
            if (graph.links.findIndex(link => link.source === name && link.target === dep) === -1) {
                graph.links.push({ source: name, target: dep, value: 1 });
                this.processDependency(dep, dependencyRoot.dependencies[dep], graph, depth + 1, dependencyRoot);
            }
        }
    }

}